import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { MobileShell, PageHeader } from "@/components/MobileShell";
import { applyValueShift } from "@/lib/ai.functions";
import { getDemoUserId } from "@/lib/demo-user";
import { Sparkles, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/feedback/$id")({
  head: () => ({
    meta: [{ title: "피드백 — CareType" }],
  }),
  component: FeedbackPage,
});

function FeedbackPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const valueShift = useServerFn(applyValueShift);
  const [shiftOpen, setShiftOpen] = useState(false);

  const { data: retro } = useQuery({
    queryKey: ["retro", id],
    queryFn: async () => {
      const { data } = await supabase.from("retrospects").select("*").eq("id", id).maybeSingle();
      return data;
    },
  });

  const ai = (retro?.ai_result as any) ?? null;

  useEffect(() => {
    if (ai?.value_shift_hint) setShiftOpen(true);
  }, [ai?.value_shift_hint]);

  if (!retro) {
    return (
      <MobileShell>
        <PageHeader title="피드백" back />
        <p className="px-5 text-sm text-muted-foreground">불러오는 중…</p>
      </MobileShell>
    );
  }

  async function applyShift() {
    const userId = getDemoUserId();
    if (!userId || !ai?.value_shift_hint) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("value_priorities")
      .eq("id", userId)
      .single();
    if (!profile) return;
    const list = [...profile.value_priorities];
    const v = ai.value_shift_hint.value as string;
    const i = list.indexOf(v);
    if (i > 0) {
      list.splice(i, 1);
      list.splice(Math.max(0, i - 2), 0, v);
    }
    await valueShift({ data: { userId, newPriorities: list } });
    toast.success("가치관 우선순위를 업데이트했어요");
    setShiftOpen(false);
  }

  return (
    <MobileShell>
      <PageHeader title={`${retro.week_no}주차 피드백`} subtitle="Solar Pro3 멀티 에이전트 분석 결과" back />

      <section className="space-y-4 px-5 pt-2">
        <article className="rounded-3xl bg-gradient-to-br from-primary/10 to-secondary p-6 shadow-card">
          <Sparkles className="size-5 text-foreground/80" />
          <p className="mt-3 font-display text-2xl leading-snug text-foreground">
            "{ai?.reframe ?? "리프레이밍 결과 준비 중"}"
          </p>
        </article>

        {ai?.strengths?.length > 0 && (
          <article className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              발견된 강점
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {ai.strengths.map((s: string) => (
                <span key={s} className="rounded-full bg-primary/10 px-3 py-1.5 text-sm text-foreground">
                  #{s}
                </span>
              ))}
            </div>
          </article>
        )}

        {ai?.solution && (
          <article className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              이번 주 솔루션
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground">{ai.solution}</p>
          </article>
        )}

        <Link
          to="/recommend"
          className="flex items-center justify-between rounded-2xl bg-primary px-5 py-4 text-primary-foreground"
        >
          <span className="font-medium">비슷한 사람 만나러 가기</span>
          <ArrowRight className="size-5" />
        </Link>
      </section>

      {shiftOpen && ai?.value_shift_hint && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30">
          <div className="w-full max-w-md rounded-t-3xl bg-card p-6">
            <h3 className="font-display text-xl text-foreground">가치관 변화 감지</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              "{ai.value_shift_hint.value}" 우선순위가{" "}
              {ai.value_shift_hint.direction === "up" ? "올라간" : "내려간"} 것 같아요. 업데이트할까요?
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button onClick={() => setShiftOpen(false)} className="rounded-2xl border border-border py-3">
                유지
              </button>
              <button onClick={applyShift} className="rounded-2xl bg-primary py-3 text-primary-foreground">
                업데이트
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="h-8" />
    </MobileShell>
  );
}
