// FastAPI proxy helper — server-only.
// Configure AI_API_URL secret (and optional AI_API_KEY) to point at the FastAPI service.
// NOTE: localhost는 Worker 런타임에서 접근 불가 — ngrok/cloudflared 등으로 외부 URL 필요.

const TIMEOUT_MS = 20000;

type FetchOpts = {
  method?: "GET" | "POST";
  body?: unknown;
  form?: Record<string, string>;
};

export async function callAi(path: string, opts: FetchOpts = {}): Promise<any | null> {
  const baseUrl = process.env.AI_API_URL;
  if (!baseUrl) {
    console.warn("[ai] AI_API_URL not configured — returning mock");
    return mockResponse(path, opts.body);
  }
  const url = `${baseUrl.replace(/\/$/, "")}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const headers: Record<string, string> = {
      ...(process.env.AI_API_KEY ? { Authorization: `Bearer ${process.env.AI_API_KEY}` } : {}),
    };
    let body: string | undefined;
    if (opts.form) {
      headers["Content-Type"] = "application/x-www-form-urlencoded";
      body = new URLSearchParams(opts.form).toString();
    } else if (opts.body !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(opts.body);
    }
    const res = await fetch(url, {
      method: opts.method ?? (opts.body || opts.form ? "POST" : "GET"),
      headers,
      body,
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error(`[ai] ${path} -> ${res.status}`);
      return mockResponse(path, opts.body);
    }
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch (err) {
    console.error("[ai] request failed:", err);
    return mockResponse(path, opts.body);
  } finally {
    clearTimeout(timer);
  }
}

// ---- demo-friendly mocks ----
function mockResponse(path: string, body: any): any {
  if (path === "/api/retrospective" || path === "/analyze") {
    const week = body?.week ?? body?.week_no ?? 1;
    const keep = Array.isArray(body?.keep) ? body.keep.join(" ") : String(body?.retrospect?.keep ?? "");
    const hard = Array.isArray(body?.hard) ? body.hard.join(" ") : String(body?.retrospect?.hard ?? "");
    const tryT = Array.isArray(body?.try) ? body.try.join(" ") : String(body?.retrospect?.try ?? "");
    const all = `${keep} ${hard} ${tryT}`;
    const axis1 = /함께|같이|동료|팀|공유|발표|친구|사람/.test(all) ? "E" : "A";
    const axis2 = /계획|준비|정리|루틴|일정|체크리스트|마감/.test(all) ? "P" : "X";
    const axis3 = /인정|평가|합격|점수|결과|비교|연봉/.test(all) ? "R" : "G";
    const axis4 = /포기|전환|바꿔|쉬|멈|놓/.test(all) ? "S" : "C";
    const care_type_code = `${axis1}${axis2}${axis3}${axis4}`;
    return {
      care_type: care_type_code,
      care_type_code,
      emotion: hard.length > 30 ? "불안" : "회복중",
      current_emotion: hard.length > 30 ? "불안" : "회복중",
      reframing: hard.includes("비교")
        ? "비교가 됐다는 건 성장을 원한다는 신호예요."
        : "이번 주의 힘듦도 다음 주의 단서가 됩니다.",
      reframe: hard.includes("비교")
        ? "비교가 됐다는 건 성장을 원한다는 신호예요."
        : "이번 주의 힘듦도 다음 주의 단서가 됩니다.",
      strength_keywords: ["자기주도성", "환경설계능력", "회복탄력성"],
      strengths: ["자기주도성", "환경설계능력", "회복탄력성"],
      solution:
        week < 3
          ? "다음 주는 비교 트리거를 줄이는 환경 설계에 집중해보세요."
          : "에너지 회복 신호가 보여요. 지원 1개를 시도해볼 타이밍입니다.",
      week,
    };
  }
  if (path === "/api/onboarding") return { ok: true };
  if (path?.startsWith("/api/recommend") || path?.startsWith("/api/rag/")) return { matches: [] };
  if (path === "/chat") return { reply: "(mock) 지금은 AI 서버에 연결되어 있지 않아요." };
  return null;
}
