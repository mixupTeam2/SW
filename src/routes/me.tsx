import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getDemoUserId } from "@/lib/demo-user";
import { MobileShell, PageHeader } from "@/components/MobileShell";
import { getCareType } from "@/lib/caretype";

export const Route = createFileRoute("/me")({
  head: () => ({ meta: [{ title: "마이 — CareType" }] }),
  component: MePage,
});

function MePage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const id = getDemoUserId();
    if (!id) navigate({ to: "/onboarding" });
    else setUserId(id);
  }, [navigate]);

  const { data: profile } = useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", userId!).maybeSingle();
      return data;
    },
  });

  function reset() {
    localStorage.removeItem("caretype.demoUserId");
    navigate({ to: "/onboarding" });
  }

  return (
    <MobileShell>
      <PageHeader title="마이" />
      {profile && (
        <div className="space-y-4 px-5">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">닉네임</p>
            <p className="mt-1 font-display text-2xl text-foreground">{profile.nickname}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Info label="CareType" value={getCareType(profile.care_type_code) ? `${getCareType(profile.care_type_code)!.code} · ${getCareType(profile.care_type_code)!.name}` : "분석 중"} />
              <Info label="누적 회고" value={`${profile.week_count}회`} />
              <Info label="도메인" value={profile.domain ?? "—"} />
              <Info label="감정" value={profile.current_emotion ?? "—"} />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">가치관 우선순위</p>
            <ol className="mt-3 space-y-1.5 text-sm text-foreground">
              {profile.value_priorities.map((v: string, i: number) => (
                <li key={v} className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs">
                    {i + 1}
                  </span>
                  {v}
                </li>
              ))}
            </ol>
          </div>

          <button onClick={reset} className="w-full rounded-2xl border border-border bg-card py-3 text-sm text-muted-foreground">
            데모 초기화
          </button>
        </div>
      )}
    </MobileShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-foreground">{value}</p>
    </div>
  );
}
