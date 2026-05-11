import type { LanguageModel } from 'ai';
import { generateText } from 'ai';

const FACT_CHECK_PROMPT = `You are a fact-checking editor for Chinese documents. Compare the provided paragraph against reference materials.

Rules:
- Check each factual claim (numbers, dates, names, policies, conclusions) against the references.
- If a claim matches or is supported by references, keep it unchanged.
- If a claim contradicts references, correct it to match the references.
- If a claim cannot be verified from references, keep it but wrap it in [待核实: ...].
- Do NOT add new content or opinions.
- Return the corrected paragraph in Markdown, followed by a brief list of changes made.`;

export async function factCheckSection(
  model: LanguageModel,
  sectionContent: string,
  referenceContext: string,
  options?: { signal?: AbortSignal },
): Promise<string> {
  const result = await generateText({
    model,
    system: FACT_CHECK_PROMPT,
    prompt: `参考资料：\n${referenceContext}\n\n待校正文段：\n${sectionContent}`,
    temperature: 0.2,
    abortSignal: options?.signal,
  });
  return result.text;
}
