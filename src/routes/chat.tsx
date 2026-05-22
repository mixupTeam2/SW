import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getDemoUserId } from "@/lib/demo-user";
import { MobileShell, PageHeader } from "@/components/MobileShell";
import { MessageCircle } from "lucide-react";

export const Route = createFileRoute("/chat")({
  head: () => ({ meta: [{ title: "채팅 — CareType" }] }),
  component: ChatList,
});

function ChatList() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const id = getDemoUserId();
    if (!id) navigate({ to: "/onboarding" });
    else setUserId(id);
  }, [navigate]);

  const { data: chats } = useQuery({
    queryKey: ["chats", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("chats")
        .select("*")
        .or(`user_a.eq.${userId},user_b.eq.${userId}`)
        .order("created_at", { ascending: false });
      if (!data || data.length === 0) return [];
      const otherIds = data.map((c) => (c.user_a === userId ? c.user_b : c.user_a));
      const { data: profiles } = await supabase.from("profiles").select("id, nickname, care_type_code").in("id", otherIds);
      return data.map((c) => ({
        ...c,
        other: profiles?.find((p) => p.id === (c.user_a === userId ? c.user_b : c.user_a)),
      }));
    },
  });

  return (
    <MobileShell>
      <PageHeader title="채팅" subtitle="비슷한 결을 가진 사람과의 1:1 대화" />
      <div className="px-5">
        {(!chats || chats.length === 0) && (
          <div className="mt-10 rounded-3xl border border-dashed border-border bg-card p-10 text-center">
            <MessageCircle className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              추천에서 채팅을 시작해보세요.
            </p>
          </div>
        )}
        <ul className="space-y-2">
          {chats?.map((c: any) => (
            <li key={c.id}>
              <Link
                to="/chat/$id"
                params={{ id: c.id }}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft"
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 font-display text-lg font-semibold text-primary">
                  {c.other?.nickname?.[0] ?? "?"}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{c.other?.nickname ?? "익명"}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.other?.care_type_code ?? "CareType 분석 중"}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </MobileShell>
  );
}
