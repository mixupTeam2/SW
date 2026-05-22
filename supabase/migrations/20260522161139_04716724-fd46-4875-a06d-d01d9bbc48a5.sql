
-- CareType MVP schema (no auth, demo)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname TEXT NOT NULL,
  specs JSONB NOT NULL DEFAULT '{}'::jsonb,
  value_priorities TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  care_type_code TEXT,
  week_count INT NOT NULL DEFAULT 0,
  current_emotion TEXT,
  current_concern TEXT,
  domain TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.retrospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_no INT NOT NULL,
  keep TEXT NOT NULL,
  hard TEXT NOT NULL,
  try TEXT NOT NULL,
  ai_result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_retrospects_user ON public.retrospects(user_id, created_at DESC);

CREATE TABLE public.recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score NUMERIC,
  reason TEXT,
  week_no INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_rec_user ON public.recommendations(user_id);

CREATE TABLE public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_a, user_b)
);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_chat ON public.messages(chat_id, created_at);

-- Demo: enable RLS and permissive policies (no auth in MVP)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retrospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "demo_all_profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "demo_all_retrospects" ON public.retrospects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "demo_all_recommendations" ON public.recommendations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "demo_all_chats" ON public.chats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "demo_all_messages" ON public.messages FOR ALL USING (true) WITH CHECK (true);

-- Realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Seed demo profiles for recommendations
INSERT INTO public.profiles (nickname, value_priorities, care_type_code, domain, current_emotion, current_concern, specs) VALUES
  ('잔잔한바다', ARRAY['근무지','워라밸','도메인','직무','연봉','기업규모','안정성'], 'DE-R형', 'IT / 기획', '불안', '자소서 공백기', '{"학점":"3.8","대외활동":"2회"}'::jsonb),
  ('새벽산책', ARRAY['워라밸','근무지','안정성','직무','도메인','연봉','기업규모'], 'WB-S형', '디자인', '지침', '포트폴리오 방향성', '{"학점":"3.5"}'::jsonb),
  ('밤하늘별', ARRAY['도메인','직무','연봉','근무지','워라밸','기업규모','안정성'], 'DO-G형', '데이터', '혼란', '직무 전환 고민', '{"학점":"4.0","자격증":"SQLD"}'::jsonb),
  ('따뜻한볕', ARRAY['연봉','기업규모','안정성','직무','도메인','워라밸','근무지'], 'SA-M형', '금융', '비교감', '대기업 vs 중견', '{"학점":"3.7"}'::jsonb),
  ('느린걸음', ARRAY['워라밸','근무지','도메인','직무','안정성','연봉','기업규모'], 'WB-L형', 'IT / 기획', '번아웃 신호', '쉬어야 할지 고민', '{"학점":"3.6"}'::jsonb);
