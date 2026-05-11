import type { SectionOutput, SectionPlan, Style, WritingPlan } from '@app/core';
import type { Retriever } from '@app/knowledge';
import type { LanguageModel } from 'ai';
import { streamText } from 'ai';

const SECTION_SYSTEM_PROMPT = `You are a professional Chinese business writer. Write the specified section of a document based on the plan, style requirements, and any reference materials provided.

Rules:
- Write in Chinese.
- Target the specified word count approximately (±20%).
- Use the reference materials as factual basis — do not fabricate data, dates, names, or policies.
- Maintain the specified tone and style.
- Output ONLY the section content, no meta-commentary.`;

export async function* writeSection(
  model: LanguageModel,
  section: SectionPlan,
  sectionIndex: number,
  plan: WritingPlan,
  style: Style,
  retriever?: Retriever,
  knowledgeBaseId?: string,
  options?: { signal?: AbortSignal },
): AsyncGenerator<SectionOutput> {
  let referenceContext = '';
  if (retriever && knowledgeBaseId && section.needsRAG) {
    const kw = section.keywords.join(' ');
    const results = await retriever.search(knowledgeBaseId, kw, 5);
    referenceContext = results.map((r, i) => `[参考资料${i + 1}]\n${r.content}`).join('\n\n');
  }

  const prompt = `请撰写以下章节：

章节标题：${section.title}
目标字数：${section.targetWords}字
风格：${style}
文章目标：${plan.goal}
目标读者：${plan.audience}

${referenceContext ? `参考资料：\n${referenceContext}` : ''}

请直接输出章节正文（Markdown格式），不要包含章节标题本身。`;

  const result = streamText({
    model,
    system: SECTION_SYSTEM_PROMPT,
    prompt,
    temperature: 0.7,
    abortSignal: options?.signal,
  });

  let fullContent = '';
  for await (const chunk of result.textStream) {
    if (options?.signal?.aborted) throw new Error('Writing cancelled');
    fullContent += chunk;
  }

  yield {
    sectionIndex,
    title: section.title,
    content: fullContent,
  };
}
