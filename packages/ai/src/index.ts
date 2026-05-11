// packages/ai/src/index.ts
import { createOpenAICompatible } from './providers/openai-compatible.js';
import { generateText } from 'ai';

export { createOpenAICompatible, getWritingModel, getEmbeddingModel } from './providers/openai-compatible.js';
export { tokenCounter } from './token-counter.js';

export interface ConnectionTestResult {
  success: boolean;
  latencyMs: number;
  error?: string;
}

export async function testConnection(
  baseUrl: string,
  apiKey: string,
  modelId: string,
): Promise<ConnectionTestResult> {
  const start = Date.now();
  try {
    const provider = createOpenAICompatible({ baseUrl, apiKey });
    const model = provider.chat(modelId);
    await generateText({ model, prompt: 'Hi', maxOutputTokens: 5 });
    return { success: true, latencyMs: Date.now() - start };
  } catch (e) {
    return { success: false, latencyMs: Date.now() - start, error: String(e) };
  }
}
