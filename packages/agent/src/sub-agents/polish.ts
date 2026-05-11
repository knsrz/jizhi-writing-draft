import type { LanguageModel } from 'ai';
import { generateText } from 'ai';

const POLISH_PROMPT = `You are a Chinese language editor. Polish the given paragraph to improve clarity, flow, and professionalism while preserving all factual content.

Rules:
- Optimize expression and sentence structure.
- Improve transitions between sentences.
- Remove redundancy and wordiness.
- Maintain the original tone and style.
- Do NOT change any facts, numbers, dates, or names.
- Keep approximately the same length.
- Return only the polished text.`;

export async function polishSection(
  model: LanguageModel,
  sectionContent: string,
  style: string,
  options?: { signal?: AbortSignal },
): Promise<string> {
  const result = await generateText({
    model,
    system: POLISH_PROMPT,
    prompt: `目标风格：${style}\n\n待润色文段：\n${sectionContent}`,
    temperature: 0.5,
    abortSignal: options?.signal,
  });
  return result.text;
}
