import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { getDemoUserId } from "@/lib/demo-user";
import { MobileShell, PageHeader } from "@/components/MobileShell";
import { refreshRecommendations } from "@/lib/ai.functions";
import { openChat } from "@/lib/chat.functions";
import { Heart, X, MessageCircle, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/recommend")({
  head: () => ({
    meta: [
      { title: "추천 — CareType" },
      { name: "description", content: "이번 주 비슷한 가치관과 감정의 친구 3명." },
    ],
  }),
  component: RecommendPage,
});

type Card = {
  rec_id: string;
  profile: any;
  reason: string | null;
  score: number | null;
};

function RecommendPage() {
  const navigate = useNavigate();
  const refresh = useServerFn(refreshRecommendations);
  const openChatFn = useServerFn(openChat);
  const [userId, setUserId] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = getDemoUserId();
    if (!id) navigate({ to: "/onboarding" });
    else setUserId(id);
  }, [navigate]);

  const { data: cards, refetch, isLoading } = useQuery({
    queryKey: ["recs", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Card[]> => {
      const { data: recs } = await supabase
        .from("recommendations")
        .select("id, target_user_id, score, reason")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(3);
      if (!recs || recs.length === 0) return [];
      const ids = recs.map((r) => r.target_user_id);
      const { data: profiles } = await supabase.from("profiles").select("*").in("id", ids);
      return recs.map((r) => ({
        rec_id: r.id,
        score: r.score as number | null,
        reason: r.reason,
        profile: profiles?.find((p) => p.id === r.target_user_id),
      }));
    },
  });

  async function doRefresh() {
    if (!userId) return;
    await refresh({ data: { userId } });
    setIdx(0);
    await refetch();
    toast.success("새 추천을 받았어요");
  }

  async function startChat(targetId: string) {
    if (!userId) return;
    const chat = await openChatFn({ data: { userId, targetUserId: targetId } });
    navigate({ to: "/chat/$id", params: { id: chat.id } });
  }

  const current = cards?.[idx];
  const done = !current && (cards?.length ?? 0) > 0;

  return (
    <MobileShell>
      <PageHeader title="이번 주 추천" subtitle="가치관 + 감정 + 고민이 닮은 3명" />

      <div className="px-5">
        {isLoading && <p className="text-sm text-muted-foreground">불러오는 중…</p>}
        {!isLoading && (cards?.length ?? 0) === 0 && (
          <EmptyState onRefresh={doRefresh} />
        )}

        {current && (
          <div className="relative mx-auto mt-2 h-[460px] w-full max-w-sm">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={current.rec_id}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, x: 200, rotate: 12 }}
                transition={{ type: "spring", stiffness: 280, damping: 28 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(_, info) => {
                  if (info.offset.x > 120) {
                    startChat(current.profile.id);
                  } else if (info.offset.x < -120) {
                    setIdx(idx + 1);
                  }
                }}
                className="absolute inset-0 flex flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-card"
              >
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">CareType</p>
                  <p className="font-display text-2xl text-foreground">
                    {current.profile?.care_type_code ?? "분석 중"}
                  </p>
                  <h3 className="mt-4 font-display text-3xl text-foreground">
                    {current.profile?.nickname}
                  </h3>

                  <dl className="mt-5 space-y-2.5 text-sm">
                    <Row k="도메인" v={current.profile?.domain ?? "—"} />
                    <Row k="1순위 가치" v={current.profile?.value_priorities?.[0] ?? "—"} />
                    <Row k="이번 주 감정" v={current.profile?.current_emotion ?? "—"} />
                    <Row k="고민" v={current.profile?.current_concern ?? "—"} />
                  </dl>

                  {current.reason && (
                    <p className="mt-5 rounded-xl bg-primary/10 px-3 py-2 text-xs text-foreground">
                      매칭 이유 · {current.reason}
                    </p>
                  )}
                </div>

                <p className="text-center text-[11px] text-muted-foreground">
                  ← 다음 추천 · 오른쪽으로 밀면 채팅 →
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {current && (
          <div className="mt-6 flex items-center justify-center gap-6">
            <button
              onClick={() => setIdx(idx + 1)}
              className="flex size-14 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-soft"
            >
              <X className="size-6" />
            </button>
            <button
              onClick={() => startChat(current.profile.id)}
              className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-card"
            >
              <MessageCircle className="size-6" />
            </button>
            <button
              onClick={() => setIdx(idx + 1)}
              className="flex size-14 items-center justify-center rounded-full bg-primary/15 text-foreground shadow-soft"
            >
              <Heart className="size-6" />
            </button>
          </div>
        )}

        {done && <EmptyState onRefresh={doRefresh} title="이번 주 추천을 모두 봤어요" />}
      </div>
    </MobileShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b border-dashed border-border py-1.5">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-medium text-foreground">{v}</dd>
    </div>
  );
}

function EmptyState({ onRefresh, title }: { onRefresh: () => void; title?: string }) {
  return (
    <div className="mt-10 flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border bg-card p-10 text-center">
      <p className="font-display text-xl text-foreground">{title ?? "아직 추천이 없어요"}</p>
      <p className="text-sm text-muted-foreground">
        분석 에이전트에게 새로운 추천을 받아볼까요?
      </p>
      <button onClick={onRefresh} className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-primary-foreground">
        <RefreshCcw className="size-4" /> 추천 받기
      </button>
    </div>
  );
}
