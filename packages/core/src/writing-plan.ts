import type { SectionPlan, WritingPlan } from './types.js';

const DEFAULT_SECTION_WORDS = 400;

export function updateWritingPlan(
  plan: WritingPlan,
  patch: Partial<Pick<WritingPlan, 'goal' | 'audience' | 'missingInfo'>>,
): WritingPlan {
  return normalizeWritingPlan({ ...plan, ...patch });
}

export function updatePlanSection(
  plan: WritingPlan,
  sectionIndex: number,
  patch: Partial<SectionPlan>,
): WritingPlan {
  if (!plan.sections[sectionIndex]) return normalizeWritingPlan(plan);

  const sections = plan.sections.map((section, index) =>
    index === sectionIndex ? normalizeSection({ ...section, ...patch }) : section,
  );

  return normalizeWritingPlan({ ...plan, sections });
}

export function addPlanSection(plan: WritingPlan): WritingPlan {
  return normalizeWritingPlan({
    ...plan,
    sections: [
      ...plan.sections,
      {
        title: '新章节',
        targetWords: DEFAULT_SECTION_WORDS,
        keywords: [],
        needsRAG: false,
      },
    ],
  });
}

export function removePlanSection(plan: WritingPlan, sectionIndex: number): WritingPlan {
  return normalizeWritingPlan({
    ...plan,
    sections: plan.sections.filter((_, index) => index !== sectionIndex),
  });
}

export function normalizeWritingPlan(plan: WritingPlan): WritingPlan {
  const sections = plan.sections.map(normalizeSection);

  return {
    ...plan,
    goal: plan.goal.trim(),
    audience: plan.audience.trim(),
    sections,
    totalWordBudget: sections.reduce((sum, section) => sum + section.targetWords, 0),
    missingInfo: plan.missingInfo?.map((item) => item.trim()).filter(Boolean),
  };
}

function normalizeSection(section: SectionPlan): SectionPlan {
  return {
    title: section.title.trim() || '未命名章节',
    targetWords: Math.max(100, Math.round(Number(section.targetWords) || DEFAULT_SECTION_WORDS)),
    keywords: section.keywords.map((keyword) => keyword.trim()).filter(Boolean),
    needsRAG: Boolean(section.needsRAG),
  };
}
