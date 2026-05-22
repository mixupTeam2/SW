import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MobileShell, PageHeader } from "@/components/MobileShell";
import { SortableValues } from "@/components/SortableValues";
import { createProfile } from "@/lib/profile.functions";
import { setDemoUserId } from "@/lib/demo-user";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "온보딩 — CareType" },
      { name: "description", content: "스펙과 가치관 우선순위를 설정해 나만의 CareType을 시작하세요." },
    ],
  }),
  component: Onboarding,
});

const DEFAULT_VALUES = ["근무지", "워라밸", "도메인", "직무", "연봉", "기업규모", "안정성"];

function Onboarding() {
  const navigate = useNavigate();
  const create = useServerFn(createProfile);
  const [step, setStep] = useState<1 | 2>(1);

  const [nickname, setNickname] = useState("");
  const [domain, setDomain] = useState("");
  const [gpa, setGpa] = useState("");
  const [activities, setActivities] = useState("");
  const [research, setResearch] = useState("");
  const [certs, setCerts] = useState("");
  const [values, setValues] = useState(DEFAULT_VALUES);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!nickname.trim()) return toast.error("닉네임을 입력해주세요.");
    setSubmitting(true);
    try {
      const profile = await create({
        data: {
          nickname: nickname.trim(),
          domain: domain.trim() || undefined,
          specs: {
            학점: gpa,
            대외활동: activities,
            연구실경험: research,
            자격증: certs,
          },
          value_priorities: values,
        },
      });
      setDemoUserId(profile.id);
      toast.success("CareType 여정을 시작합니다");
      navigate({ to: "/" });
    } catch (e) {
      toast.error("저장에 실패했어요. 다시 시도해주세요.");
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <MobileShell hideTabs>
      <PageHeader
        title={step === 1 ? "당신을 알려주세요" : "무엇이 중요한가요?"}
        subtitle={
          step === 1
            ? "스펙은 비교 도구가 아니라, 더 잘 맞는 사람을 찾기 위한 단서예요."
            : "드래그로 순서를 바꿔보세요. 1순위가 가장 중요한 가치예요."
        }
      />

      {step === 1 ? (
        <div className="space-y-4 px-5 pt-2">
          <Field label="닉네임 *">
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="얼굴 대신 보일 닉네임"
              className="input"
            />
          </Field>
          <Field label="관심 도메인">
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="예: IT / 기획, 디자인, 데이터…"
              className="input"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="학점">
              <input value={gpa} onChange={(e) => setGpa(e.target.value)} placeholder="3.8" className="input" />
            </Field>
            <Field label="대외활동">
              <input
                value={activities}
                onChange={(e) => setActivities(e.target.value)}
                placeholder="2회"
                className="input"
              />
            </Field>
            <Field label="연구실 경험">
              <input
                value={research}
                onChange={(e) => setResearch(e.target.value)}
                placeholder="6개월"
                className="input"
              />
            </Field>
            <Field label="자격증">
              <input value={certs} onChange={(e) => setCerts(e.target.value)} placeholder="SQLD" className="input" />
            </Field>
          </div>

          <button onClick={() => setStep(2)} className="btn-primary mt-6 w-full">
            다음
          </button>
        </div>
      ) : (
        <div className="px-5 pt-2">
          <SortableValues items={values} onChange={setValues} />
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button onClick={() => setStep(1)} className="btn-ghost">이전</button>
            <button onClick={submit} disabled={submitting} className="btn-primary">
              {submitting ? "저장 중…" : "시작하기"}
            </button>
          </div>
        </div>
      )}

      <style>{`
        .input { width: 100%; border-radius: 0.75rem; border: 1px solid var(--color-border); background: var(--color-card); padding: 0.75rem 0.9rem; font-size: 0.95rem; color: var(--color-foreground); }
        .input::placeholder { color: var(--color-muted-foreground); }
        .input:focus { outline: 2px solid var(--color-primary); outline-offset: 1px; }
        .btn-primary { display:inline-flex; align-items:center; justify-content:center; gap:0.5rem; width:100%; border-radius: 1rem; padding: 0.95rem 1rem; background: var(--color-primary); color: var(--color-primary-foreground); font-weight: 500; transition: transform .12s ease; }
        .btn-primary:active { transform: scale(1.0); }
        .btn-primary:disabled { opacity: .6; }
        .btn-ghost { display:inline-flex; align-items:center; justify-content:center; width:100%; border-radius: 1rem; padding: 0.95rem 1rem; border: 1px solid var(--color-border); background: var(--color-card); color: var(--color-foreground); }
      `}</style>
    </MobileShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-foreground/80">{label}</span>
      {children}
    </label>
  );
}
