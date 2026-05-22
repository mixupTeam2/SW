// CareType 4축 정의 및 16종 매핑

export const AXES = {
  axis1: { pos: "E", neg: "A", label: "감정 대응 방식", posLabel: "외향", negLabel: "내향" },
  axis2: { pos: "P", neg: "X", label: "행동 전략", posLabel: "계획", negLabel: "탐색" },
  axis3: { pos: "G", neg: "R", label: "동기 원천", posLabel: "성장", negLabel: "인정" },
  axis4: { pos: "C", neg: "S", label: "스트레스 반응", posLabel: "지속", negLabel: "전환" },
} as const;

export type CareTypeCode =
  | "APGC" | "APGS" | "APRC" | "APRS"
  | "AXGC" | "AXGS" | "AXRC" | "AXRS"
  | "EPGC" | "EPGS" | "EPRC" | "EPRS"
  | "EXGC" | "EXGS" | "EXRC" | "EXRS";

export const CARE_TYPES: Record<CareTypeCode, { name: string; description: string }> = {
  APGC: { name: "묵묵한 설계자", description: "혼자 계획을 세우고 묵묵히 성장해나가는 유형" },
  APGS: { name: "유연한 전략가", description: "내면 중심이지만 막히면 유연하게 방향을 바꾸는 유형" },
  APRC: { name: "인정받는 완벽주의자", description: "혼자 철저히 준비해 결과로 인정받으려는 유형" },
  APRS: { name: "현실적인 조율자", description: "평가를 의식하면서도 현실적으로 방향을 조율하는 유형" },
  AXGC: { name: "고독한 탐험가", description: "혼자 다양한 시도를 하며 배움에서 동력을 얻는 유형" },
  AXGS: { name: "자유로운 실험가", description: "혼자 이것저것 시도하다 막히면 쉽게 전환하는 유형" },
  AXRC: { name: "승부사형 도전자", description: "혼자 도전하며 결과와 인정을 위해 버티는 유형" },
  AXRS: { name: "감각적인 방랑자", description: "혼자 경험을 쌓으며 반응에 따라 방향을 바꾸는 유형" },
  EPGC: { name: "열정적인 추진자", description: "공유하며 동기를 얻고 성장을 위해 끝까지 밀어붙이는 유형" },
  EPGS: { name: "공감형 리더", description: "함께 계획하고 성장하되 상황에 따라 유연하게 전환하는 유형" },
  EPRC: { name: "무대형 실행가", description: "표출하며 에너지를 얻고 인정받기 위해 계획을 고수하는 유형" },
  EPRS: { name: "유쾌한 전환자", description: "공유하며 인정받되 막히면 빠르게 방향을 전환하는 유형" },
  EXGC: { name: "에너지형 탐색자", description: "다양한 시도를 공유하며 배움 자체에서 동력을 얻는 유형" },
  EXGS: { name: "네트워크형 모험가", description: "사람들과 함께 탐색하며 막히면 자연스럽게 전환하는 유형" },
  EXRC: { name: "존재감형 도전자", description: "표출하며 다양하게 도전해 인정받고자 끝까지 버티는 유형" },
  EXRS: { name: "감성적인 흐름형", description: "감각과 공유로 이것저것 시도하다 흐름에 따라 전환하는 유형" },
};

export function getCareType(code: string | null | undefined) {
  if (!code) return null;
  const upper = code.toUpperCase() as CareTypeCode;
  return CARE_TYPES[upper] ? { code: upper, ...CARE_TYPES[upper] } : null;
}
