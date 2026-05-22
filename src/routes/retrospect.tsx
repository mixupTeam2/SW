import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MobileShell, PageHeader } from "@/components/MobileShell";
import { submitRetrospect } from "@/lib/ai.functions";
import { getDemoUserId } from "@/lib/demo-user";
import { toast } from "sonner";
import { Smile, AlertCircle, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/retrospect")({
  head: () => ({
    meta: [
      { title: "주간 회고 — CareType" },
      { name: "description", content: "Keep / Hard / Try 구조로 한 주를 돌아봅니다." },
    ],
  }),
  component: RetroPage,
});

function RetroPage() {
  const navigate = useNavigate();
  const submit = useServerFn(submitRetrospect);
  const [keep, setKeep] = useState("");
  const [hard, setHard] = useState("");
  const [tryNext, setTryNext] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    const userId = getDemoUserId();
    if (!userId) return navigate({ to: "/onboarding" });
    if (!keep.trim() || !hard.trim() || !tryNext.trim()) {
      toast.error("세 칸 모두 짧게라도 적어주세요.");
      return;
    }
    setLoading(true);
    try {
      const res = await submit({ data: { userId, keep, hard, try: tryNext } });
      navigate({ to: "/feedback/$id", params: { id: res.retrospect.id } });
    } catch (e) {
      console.error(e);
      toast.error("분석 요청 실패. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <MobileShell>
      <PageHeader title="이번 주 회고" subtitle="짧아도 좋아요. 솔직한 한 줄이면 충분합니다." />

      <div className="space-y-4 px-5 pt-2">
        <KHTBlock
          tone="keep"
          icon={<Smile className="size-4" />}
          label="Keep · 잘 됐던 것"
          placeholder="예: 알람 없이 기상, 산책 30분"
          value={keep}
          onChange={setKeep}
        />
        <KHTBlock
          tone="hard"
          icon={<AlertCircle className="size-4" />}
          label="Hard · 힘들었던 것"
          placeholder="예: 유튜브 보다 비교돼서 우울해짐"
          value={hard}
          onChange={setHard}
        />
        <KHTBlock
          tone="try"
          icon={<ArrowRight className="size-4" />}
          label="Try · 다음 주 시도할 것"
          placeholder="예: 음악 틀어놓고 공부해보기"
          value={tryNext}
          onChange={setTryNext}
        />

        <button onClick={onSubmit} disabled={loading} className="mt-3 w-full rounded-2xl bg-primary py-4 text-primary-foreground font-medium">
          {loading ? "AI가 분석 중…" : "AI 분석 받기"}
        </button>
      </div>
      <div className="h-8" />
    </MobileShell>
  );
}

function KHTBlock({
  tone,
  icon,
  label,
  placeholder,
  value,
  onChange,
}: {
  tone: "keep" | "hard" | "try";
  icon: React.ReactNode;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const toneClass =
    tone === "keep"
      ? "bg-primary/10 text-foreground"
      : tone === "hard"
        ? "bg-accent/40 text-[oklch(0.35_0.05_50)]"
        : "bg-secondary text-foreground";

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className={`mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${toneClass}`}>
        {icon}
        {label}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-none bg-transparent text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
      />
    </div>
  );
}
