import type { WritingPlan, WritingRequest } from '@app/core';
import type { Retriever } from '@app/knowledge';
import type { LanguageModel } from 'ai';
import { generateText } from 'ai';

const PLAN_SYSTEM_PROMPT = `You are a writing planner for Chinese business documents. Given a topic, writing type, target word count, and style requirements, generate a structured writing plan.

Output ONLY valid JSON in this exact format:
{
  "goal": "一句话描述文章目标",
  "audience": "目标读者描述",
  "sections": [
    {
      "title": "章节标题",
      "targetWords": 数字,
      "keywords": ["检索关键词1", "检索关键词2"],
      "needsRAG": true
    }
  ],
  "totalWordBudget": 数字,
  "missingInfo": ["需用户补充的信息"]
}

Rules:
- Total word budget across all sections must sum to roughly the target word count.
- Each section's targetWords should be proportional to its importance.
- Extract meaningful keywords that would help retrieve relevant documents.`;

export async function generatePlan(
  model: LanguageModel,
  request: WritingRequest,
  _retriever?: Retriever,
  knowledgeBaseId?: string,
  options?: { signal?: AbortSignal },
): Promise<WritingPlan> {
  const prompt = `写作类型：${request.type}
写作主题：${request.topic}
目标字数：${request.targetWords}
风格：${request.style}
知识库：${knowledgeBaseId ? '已选择，可按需标记 needsRAG' : '未使用，所有章节 needsRAG 必须为 false'}
${request.userOutline ? `用户大纲：${request.userOutline}` : ''}

请为此生成写作计划。`;

  const result = await generateText({
    model,
    system: PLAN_SYSTEM_PROMPT,
    prompt,
    temperature: 0.3,
    abortSignal: options?.signal,
  });

  const text = result.text.trim();
  const jsonStart = text.indexOf('{');
  const jsonEnd = text.lastIndexOf('}') + 1;
  const plan: WritingPlan = JSON.parse(text.slice(jsonStart, jsonEnd));

  return normalizeGeneratedPlan(plan, {
    targetWords: request.targetWords,
    hasKnowledgeBase: Boolean(knowledgeBaseId),
  });
}

export function normalizeGeneratedPlan(
  plan: WritingPlan,
  options: { targetWords: number; hasKnowledgeBase: boolean },
): WritingPlan {
  const targetWords = normalizeTargetWords(options.targetWords);
  const sections = scaleSectionWords(plan.sections, targetWords).map((section) => ({
    ...section,
    title: section.title.trim() || '未命名章节',
    keywords: section.keywords.map((keyword) => keyword.trim()).filter(Boolean),
    needsRAG: options.hasKnowledgeBase ? Boolean(section.needsRAG) : false,
  }));

  return {
    ...plan,
    goal: plan.goal.trim(),
    audience: plan.audience.trim(),
    sections,
    totalWordBudget: sections.reduce((sum, section) => sum + section.targetWords, 0),
    missingInfo: plan.missingInfo?.map((item) => item.trim()).filter(Boolean),
  };
}

function scaleSectionWords(sections: WritingPlan['sections'], targetWords: number) {
  if (sections.length === 0) return [];

  const weights = sections.map((section) => Math.max(1, Number(section.targetWords) || 1));
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
  const scaled = sections.map((section, index) => {
    const rawWords = (weights[index] / weightTotal) * targetWords;
    return {
      section,
      words: Math.floor(rawWords),
      remainder: rawWords - Math.floor(rawWords),
    };
  });

  let remaining = targetWords - scaled.reduce((sum, item) => sum + item.words, 0);
  for (const item of [...scaled].sort((a, b) => b.remainder - a.remainder)) {
    if (remaining <= 0) break;
    item.words += 1;
    remaining -= 1;
  }

  return scaled.map(({ section, words }) => ({
    ...section,
    targetWords: Math.max(1, words),
  }));
}

function normalizeTargetWords(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 2000;
  return Math.max(100, Math.round(value));
}
