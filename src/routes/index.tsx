import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getDemoUserId } from "@/lib/demo-user";
import { MobileShell } from "@/components/MobileShell";
import { getCareType } from "@/lib/caretype";
import { ArrowRight, Sparkles, NotebookPen, Users } from "lucide-react";
import otterMascot from "@/assets/caretype-otter.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CareType — 매주, 나를 케어합니다" },
      { name: "description", content: "취준생을 위한 AI 케어. 번아웃 전에, 회고와 연결로." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const id = getDemoUserId();
    if (!id) {
      navigate({ to: "/onboarding" });
      return;
    }
    setUserId(id);
  }, [navigate]);

  const { data: profile } = useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", userId!).maybeSingle();
      return data;
    },
  });

  const { data: lastRetro } = useQuery({
    queryKey: ["last-retro", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("retrospects")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  if (!userId) return null;
  const weekCount = profile?.week_count ?? 0;
  const careType = getCareType(profile?.care_type_code);

  return (
    <MobileShell>
      <header className="px-5 pt-6">
        <p className="text-sm text-muted-foreground">안녕하세요,</p>
        <h1 className="font-display text-3xl text-foreground">
          {profile?.nickname ?? "친구"}님
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          이번 주 {weekCount + 1}번째 회고가 기다리고 있어요.
        </p>
      </header>

      <section className="px-5 pt-6">
        <div className="flex flex-col items-center rounded-3xl bg-gradient-to-br from-primary/10 to-secondary p-6 shadow-card text-center">
          <img
            src={otterMascot}
            alt="CareType 마스코트"
            className="size-40 object-contain drop-shadow-lg"
          />

          <p className="mt-4 text-xs uppercase tracking-widest text-foreground/70">CareType</p>
          {careType ? (
            <>
              <p className="mt-1 font-display text-4xl font-bold tracking-tight text-primary">
                {careType.code}
              </p>
              <p className="mt-1 font-display text-lg font-semibold text-foreground">
                {careType.name}
              </p>
            </>
          ) : (
            <p className="mt-1 font-display text-3xl text-foreground">분석 중</p>
          )}

          <p className="mt-4 max-w-[260px] text-sm leading-relaxed text-foreground/80">
            {careType
              ? careType.description
              : `회고를 ${Math.max(0, 10 - weekCount)}회 더 쌓으면 나만의 CareType 코드가 만들어져요.`}
          </p>

          <div className="mt-5 w-full">
            <div className="h-2 overflow-hidden rounded-full bg-secondary/70">
              <div
                className="h-full rounded-full bg-primary/70 transition-all"
                style={{ width: `${Math.min(100, (weekCount / 10) * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-right text-xs text-foreground/60">{weekCount} / 10 회</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 px-5 pt-5">
        <ActionCard to="/retrospect" icon={<NotebookPen className="size-5" />} label="이번 주 회고" />
        <ActionCard to="/recommend" icon={<Users className="size-5" />} label="추천 받기" />
      </section>

      {lastRetro?.ai_result && (
        <section className="px-5 pt-6">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">지난 피드백</h2>
          <Link
            to="/feedback/$id"
            params={{ id: lastRetro.id }}
            className="block rounded-2xl border border-border bg-card p-5 shadow-soft"
          >
            <p className="text-sm leading-relaxed text-foreground">
              "{(lastRetro.ai_result as any)?.reframe ?? "리프레이밍 결과 보기"}"
            </p>
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>{new Date(lastRetro.created_at).toLocaleDateString("ko-KR")}</span>
              <ArrowRight className="size-4" />
            </div>
          </Link>
        </section>
      )}

      <div className="h-10" />
    </MobileShell>
  );
}

function ActionCard({
  to,
  icon,
  label,
}: {
  to: "/retrospect" | "/recommend";
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft transition-transform active:scale-[0.98]"
    >
      <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-foreground">
        {icon}
      </span>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </Link>
  );
}
