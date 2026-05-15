import type { WritingPlan } from '@app/core';
import { describe, expect, it } from 'vitest';
import { normalizeGeneratedPlan } from './planner';

const ragPlan: WritingPlan = {
  goal: '形成通知',
  audience: '全体员工',
  sections: [
    {
      title: '事项说明',
      targetWords: 1200,
      keywords: ['制度'],
      needsRAG: true,
    },
    {
      title: '执行要求',
      targetWords: 800,
      keywords: ['流程'],
      needsRAG: true,
    },
  ],
  totalWordBudget: 2000,
  missingInfo: [],
};

describe('normalizeGeneratedPlan', () => {
  it('removes knowledge retrieval markers when no knowledge base is selected', () => {
    const plan = normalizeGeneratedPlan(ragPlan, { targetWords: 200, hasKnowledgeBase: false });

    expect(plan.sections.every((section) => section.needsRAG === false)).toBe(true);
    expect(plan.totalWordBudget).toBe(200);
    expect(plan.sections.map((section) => section.targetWords)).toEqual([120, 80]);
  });

  it('keeps retrieval markers when a knowledge base is selected', () => {
    const plan = normalizeGeneratedPlan(ragPlan, { targetWords: 200, hasKnowledgeBase: true });

    expect(plan.sections.every((section) => section.needsRAG === true)).toBe(true);
    expect(plan.totalWordBudget).toBe(200);
  });
});
