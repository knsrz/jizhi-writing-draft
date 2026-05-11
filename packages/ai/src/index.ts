// packages/ai/src/index.ts

import { embedMany, generateText } from 'ai';
import { createOpenAICompatible } from './providers/openai-compatible.js';

export {
  createOpenAICompatible,
  getEmbeddingModel,
  getWritingModel,
} from './providers/openai-compatible.js';
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
  kind: 'writing' | 'embedding' = 'writing',
): Promise<ConnectionTestResult> {
  const start = Date.now();
  try {
    const provider = createOpenAICompatible({ baseUrl, apiKey });
    if (kind === 'embedding') {
      const model = provider.embedding(modelId);
      await embedMany({ model, values: ['connection test'] });
    } else {
      const model = provider.chat(modelId);
      await generateText({ model, prompt: 'Hi', maxOutputTokens: 5 });
    }
    return { success: true, latencyMs: Date.now() - start };
  } catch (e) {
    return { success: false, latencyMs: Date.now() - start, error: String(e) };
  }
}
