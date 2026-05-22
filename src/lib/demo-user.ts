// Demo user identity (no auth). Stored in localStorage.
import { supabase } from "@/integrations/supabase/client";

const KEY = "caretype.demoUserId";

export function getDemoUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY);
}

export function setDemoUserId(id: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, id);
}

export async function ensureDemoProfileLoaded() {
  const id = getDemoUserId();
  if (!id) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  if (!data) {
    localStorage.removeItem(KEY);
    return null;
  }
  return data;
}
