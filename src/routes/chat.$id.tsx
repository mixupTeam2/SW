import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getDemoUserId } from "@/lib/demo-user";
import { sendMessage } from "@/lib/chat.functions";
import { MobileShell } from "@/components/MobileShell";
import { ArrowLeft, Send } from "lucide-react";

export const Route = createFileRoute("/chat/$id")({
  head: () => ({ meta: [{ title: "대화 — CareType" }] }),
  component: ChatRoom,
});

function ChatRoom() {
  const { id: chatId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const send = useServerFn(sendMessage);
  const [userId, setUserId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = getDemoUserId();
    if (!id) navigate({ to: "/onboarding" });
    else setUserId(id);
  }, [navigate]);

  const { data: chat } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: async () => {
      const { data } = await supabase.from("chats").select("*").eq("id", chatId).single();
      if (!data) return null;
      const otherId = data.user_a === userId ? data.user_b : data.user_a;
      const { data: other } = await supabase.from("profiles").select("id, nickname, care_type_code").eq("id", otherId).maybeSingle();
      return { ...data, other };
    },
    enabled: !!userId,
  });

  const { data: messages } = useQuery({
    queryKey: ["messages", chatId],
    queryFn: async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });
      return data ?? [];
    },
  });

  // Realtime
  useEffect(() => {
    const ch = supabase
      .channel(`messages-${chatId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${chatId}` },
        () => qc.invalidateQueries({ queryKey: ["messages", chatId] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [chatId, qc]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function onSend() {
    if (!text.trim() || !userId) return;
    const content = text.trim();
    setText("");
    await send({ data: { chatId, senderId: userId, content } });
    qc.invalidateQueries({ queryKey: ["messages", chatId] });
  }

  return (
    <MobileShell hideTabs hideHeader>
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <button
          onClick={() => navigate({ to: "/chat" })}
          className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary"
          aria-label="뒤로"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-semibold text-primary">
          {chat?.other?.nickname?.[0] ?? "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground">
            {chat?.other?.nickname ?? "익명"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {chat?.other?.care_type_code ?? "온라인"}
          </p>
        </div>
      </header>

      <div
        className="space-y-2 px-4 py-4"
        style={{ minHeight: "calc(100dvh - 8rem)" }}
      >
        {messages?.length === 0 && (
          <div className="mt-16 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
              <Send className="size-5 text-primary" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              첫 메시지를 보내보세요. 익명이라 부담 없어요.
            </p>
          </div>
        )}
        {messages?.map((m) => {
          const mine = m.sender_id === userId;
          return (
            <div
              key={m.id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-soft ${
                  mine
                    ? "rounded-br-md bg-primary text-primary-foreground"
                    : "rounded-bl-md border border-border bg-card text-foreground"
                }`}
              >
                {m.content}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSend();
        }}
        className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-md -translate-x-1/2 items-center gap-2 border-t border-border bg-background/95 px-4 py-3 backdrop-blur"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="메시지를 입력하세요"
          className="flex-1 rounded-2xl border border-border bg-card px-4 py-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft transition-opacity disabled:opacity-40"
          aria-label="전송"
        >
          <Send className="size-4" />
        </button>
      </form>
    </MobileShell>
  );
}
