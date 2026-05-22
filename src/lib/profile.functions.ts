import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseServer as supabaseAdmin } from "./supabase-server";
import { callAi } from "./ai.server";

const OnboardInput = z.object({
  nickname: z.string().min(1).max(40),
  specs: z.record(z.string(), z.string()),
  value_priorities: z.array(z.string()).length(7),
  domain: z.string().max(40).optional(),
});

function toNum(v: string | undefined): number {
  const n = parseFloat(String(v ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export const createProfile = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => OnboardInput.parse(d))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("profiles")
      .insert({
        nickname: data.nickname,
        specs: data.specs,
        value_priorities: data.value_priorities,
        domain: data.domain ?? null,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    // Best-effort onboarding push to FastAPI
    await callAi("/api/onboarding", {
      method: "POST",
      body: {
        user_id: row.id,
        spec: {
          gpa: toNum(data.specs["학점"]),
          activities: data.specs["대외활동"] ? [data.specs["대외활동"]] : [],
          lab_experience: !!(data.specs["연구실경험"] && data.specs["연구실경험"].trim()),
          certifications: data.specs["자격증"] ? [data.specs["자격증"]] : [],
        },
        values_priority: data.value_priorities,
      },
    });

    return row;
  });
