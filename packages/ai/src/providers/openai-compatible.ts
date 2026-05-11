import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModel, EmbeddingModel } from 'ai';

export interface ProviderConfig {
  baseUrl: string;
  apiKey: string;
}

export function createOpenAICompatible(config: ProviderConfig) {
  return createOpenAI({
    baseURL: config.baseUrl,
    apiKey: config.apiKey,
  });
}

export function getWritingModel(provider: ReturnType<typeof createOpenAICompatible>, modelId: string): LanguageModel {
  return provider.chat(modelId) as LanguageModel;
}

export function getEmbeddingModel(
  provider: ReturnType<typeof createOpenAICompatible>,
  modelId: string,
): EmbeddingModel {
  return provider.embedding(modelId);
}
