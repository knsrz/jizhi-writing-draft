import { describe, expect, it } from 'vitest';
import {
  addPlanSection,
  removePlanSection,
  updatePlanSection,
  updateWritingPlan,
} from './writing-plan';

const basePlan = {
  goal: '形成一份季度总结',
  audience: '部门负责人',
  sections: [
    {
      title: '工作概览',
      targetWords: 500,
      keywords: ['季度', '成果'],
      needsRAG: true,
    },
    {
      title: '下季度计划',
      targetWords: 700,
      keywords: ['计划'],
      needsRAG: false,
    },
  ],
  totalWordBudget: 1200,
  missingInfo: [],
};

describe('writing plan editing helpers', () => {
  it('updates editable plan fields while keeping the word budget in sync', () => {
    const plan = updateWritingPlan(basePlan, {
      goal: '输出一份可提交的复盘报告',
      audience: '管理层',
    });

    expect(plan.goal).toBe('输出一份可提交的复盘报告');
    expect(plan.audience).toBe('管理层');
    expect(plan.totalWordBudget).toBe(1200);
  });

  it('updates a section and recalculates the total word budget', () => {
    const plan = updatePlanSection(basePlan, 1, {
      title: '后续行动',
      targetWords: 900,
      keywords: ['行动', '负责人'],
      needsRAG: true,
    });

    expect(plan.sections[1]).toEqual({
      title: '后续行动',
      targetWords: 900,
      keywords: ['行动', '负责人'],
      needsRAG: true,
    });
    expect(plan.totalWordBudget).toBe(1400);
  });

  it('adds and removes sections without mutating the original plan', () => {
    const added = addPlanSection(basePlan);
    const removed = removePlanSection(added, 0);

    expect(basePlan.sections).toHaveLength(2);
    expect(added.sections).toHaveLength(3);
    expect(added.sections[2]).toEqual({
      title: '新章节',
      targetWords: 400,
      keywords: [],
      needsRAG: false,
    });
    expect(added.totalWordBudget).toBe(1600);
    expect(removed.sections.map((section) => section.title)).toEqual(['下季度计划', '新章节']);
    expect(removed.totalWordBudget).toBe(1100);
  });
});
