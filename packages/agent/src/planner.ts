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
  _knowledgeBaseId?: string,
  options?: { signal?: AbortSignal },
): Promise<WritingPlan> {
  const prompt = `写作类型：${request.type}
写作主题：${request.topic}
目标字数：${request.targetWords}
风格：${request.style}
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

  const totalWords = plan.sections.reduce((sum, s) => sum + s.targetWords, 0);
  plan.totalWordBudget = totalWords;

  return plan;
}
