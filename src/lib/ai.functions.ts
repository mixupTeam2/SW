// Server functions that proxy to the FastAPI AI agent service
// and persist results to the database.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseServer as supabaseAdmin } from "./supabase-server";
import { callAi } from "./ai.server";

const RetroInput = z.object({
  userId: z.string().uuid(),
  keep: z.string().min(1).max(2000),
  hard: z.string().min(1).max(2000),
  try: z.string().min(1).max(2000),
});

function toLines(s: string): string[] {
  return s
    .split(/\r?\n|·|•|,|;/)
    .map((x) => x.trim())
    .filter(Boolean);
}

export const submitRetrospect = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => RetroInput.parse(d))
  .handler(async ({ data }) => {
    const [{ data: profile }, { data: history }] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").eq("id", data.userId).single(),
      supabaseAdmin
        .from("retrospects")
        .select("week_no, keep, hard, try, ai_result")
        .eq("user_id", data.userId)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const weekNo = (profile?.week_count ?? 0) + 1;

    // axis_scores_history (from past ai_result if present)
    const axis_scores_history = (history ?? [])
      .map((h: any) => h?.ai_result?.axis_scores)
      .filter(Boolean);

    // FastAPI: POST /api/retrospective
    const ai = await callAi("/api/retrospective", {
      method: "POST",
      body: {
        user_id: data.userId,
        week: weekNo,
        keep: toLines(data.keep),
        hard: toLines(data.hard),
        try: toLines(data.try),
        values_priority: profile?.value_priorities ?? [],
        axis_scores_history,
      },
    });

    // Normalize fields (FastAPI uses care_type / emotion / reframing / strength_keywords)
    const care_type_code: string | undefined = ai?.care_type_code ?? ai?.care_type;
    const current_emotion: string | undefined = ai?.current_emotion ?? ai?.emotion;

    // Persist retrospect with AI result
    const { data: inserted, error } = await supabaseAdmin
      .from("retrospects")
      .insert({
        user_id: data.userId,
        week_no: weekNo,
        keep: data.keep,
        hard: data.hard,
        try: data.try,
        ai_result: ai,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    // Save report into graph (best-effort)
    if (ai) {
      await callAi("/api/graph/save", {
        method: "POST",
        body: {
          user_id: data.userId,
          week: weekNo,
          care_type: care_type_code ?? "",
          emotion: current_emotion ?? "",
          emotion_signal: ai?.emotion_signal ?? "",
          concern_keywords: ai?.concern_keywords ?? [],
          value_priority: profile?.value_priorities ?? [],
          value_changed: !!ai?.value_shift_hint,
          reframing: ai?.reframing ?? ai?.reframe ?? "",
          strength_keywords: ai?.strength_keywords ?? ai?.strengths ?? [],
        },
      });
    }

    // Update profile
    const updates: {
      week_count: number;
      updated_at: string;
      care_type_code?: string;
      current_emotion?: string;
    } = { week_count: weekNo, updated_at: new Date().toISOString() };
    if (care_type_code) updates.care_type_code = care_type_code;
    if (current_emotion) updates.current_emotion = current_emotion;
    await supabaseAdmin.from("profiles").update(updates).eq("id", data.userId);

    return { retrospect: inserted, ai };
  });

const ValueShiftInput = z.object({
  userId: z.string().uuid(),
  newPriorities: z.array(z.string()).length(7),
});

export const applyValueShift = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ValueShiftInput.parse(d))
  .handler(async ({ data }) => {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("week_count")
      .eq("id", data.userId)
      .single();

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ value_priorities: data.newPriorities, updated_at: new Date().toISOString() })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);

    // notify FastAPI graph
    await callAi("/api/graph/update-value", {
      method: "POST",
      body: {
        user_id: data.userId,
        new_value_priority: data.newPriorities,
        week: profile?.week_count ?? 0,
      },
    });
    return { ok: true };
  });

const RecommendInput = z.object({ userId: z.string().uuid() });

export const refreshRecommendations = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => RecommendInput.parse(d))
  .handler(async ({ data }) => {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", data.userId)
      .single();

    // FastAPI: GET /api/recommend/{user_id}
    const ai = await callAi(`/api/recommend/${encodeURIComponent(data.userId)}`, {
      method: "GET",
    });

    let matches: Array<{ target_user_id: string; score?: number; reason?: string }> = [];
    if (Array.isArray(ai)) {
      matches = ai.map((m: any) => ({
        target_user_id: m.user_id ?? m.target_user_id ?? m.id,
        score: m.score,
        reason: m.reason ?? m.care_type,
      })).filter((m) => m.target_user_id);
    } else if (Array.isArray(ai?.matches)) {
      matches = ai.matches;
    } else if (Array.isArray(ai?.recommendations)) {
      matches = ai.recommendations.map((m: any) => ({
        target_user_id: m.user_id ?? m.target_user_id,
        score: m.score,
        reason: m.reason ?? m.care_type,
      })).filter((m: any) => m.target_user_id);
    }

    if (matches.length === 0) {
      const { data: others } = await supabaseAdmin
        .from("profiles")
        .select("id, value_priorities, care_type_code")
        .neq("id", data.userId)
        .limit(20);
      matches = (others ?? []).slice(0, 3).map((o, i) => ({
        target_user_id: o.id,
        score: 0.9 - i * 0.05,
        reason: o.care_type_code ? `${o.care_type_code} · 가치관 유사` : "가치관 우선순위 유사",
      }));
    }

    const weekNo = profile?.week_count ?? 0;
    await supabaseAdmin
      .from("recommendations")
      .delete()
      .eq("user_id", data.userId)
      .eq("week_no", weekNo);

    if (matches.length > 0) {
      await supabaseAdmin.from("recommendations").insert(
        matches.slice(0, 3).map((m) => ({
          user_id: data.userId,
          target_user_id: m.target_user_id,
          score: m.score ?? null,
          reason: m.reason ?? null,
          week_no: weekNo,
        }))
      );
    }

    return { count: matches.length };
  });

// Chat passthrough to FastAPI /chat (form-urlencoded)
const ChatInput = z.object({
  message: z.string().min(1).max(2000),
  model: z.string().max(80).optional(),
});

export const aiChat = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ChatInput.parse(d))
  .handler(async ({ data }) => {
    const ai = await callAi("/chat", {
      method: "POST",
      form: { message: data.message, ...(data.model ? { model: data.model } : {}) },
    });
    const reply =
      typeof ai === "string"
        ? ai
        : ai?.reply ?? ai?.response ?? ai?.message ?? JSON.stringify(ai ?? {});
    return { reply };
  });
