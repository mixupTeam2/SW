import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseServer as supabaseAdmin } from "./supabase-server";

const OpenChatInput = z.object({
  userId: z.string().uuid(),
  targetUserId: z.string().uuid(),
});

export const openChat = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => OpenChatInput.parse(d))
  .handler(async ({ data }) => {
    const [a, b] = [data.userId, data.targetUserId].sort();
    const existing = await supabaseAdmin
      .from("chats")
      .select("*")
      .eq("user_a", a)
      .eq("user_b", b)
      .maybeSingle();
    if (existing.data) return existing.data;
    const { data: chat, error } = await supabaseAdmin
      .from("chats")
      .insert({ user_a: a, user_b: b })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return chat;
  });

const SendInput = z.object({
  chatId: z.string().uuid(),
  senderId: z.string().uuid(),
  content: z.string().min(1).max(2000),
});

export const sendMessage = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SendInput.parse(d))
  .handler(async ({ data }) => {
    const { data: msg, error } = await supabaseAdmin
      .from("messages")
      .insert({ chat_id: data.chatId, sender_id: data.senderId, content: data.content })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return msg;
  });
