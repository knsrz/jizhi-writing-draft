import type { LanguageModel } from 'ai';
import { generateText } from 'ai';

export async function reviseDocument(
  model: LanguageModel,
  content: string,
  instruction: string,
  options?: { signal?: AbortSignal },
): Promise<string> {
  const result = await generateText({
    model,
    system:
      '你是严谨的中文办公写作编辑。根据用户修改要求改写全文，保留原有事实、结构和 Markdown 标题层级。只输出修改后的 Markdown 正文，不要解释修改过程。',
    prompt: `用户修改要求：${instruction.trim()}\n\n当前全文：\n${content}`,
    temperature: 0.3,
    abortSignal: options?.signal,
  });

  return result.text.trim();
}
