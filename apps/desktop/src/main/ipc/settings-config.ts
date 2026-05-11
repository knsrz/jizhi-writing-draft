export interface ConnectionTestInput {
  baseUrl: string;
  apiKey?: string;
  writingModel: string;
}

export interface SavedModelConfig {
  provider: string;
  baseUrl: string;
  apiKey: string;
  writingModel: string;
  embeddingModel: string;
}

export function buildConnectionTestConfig(
  input: ConnectionTestInput,
  saved: SavedModelConfig | null,
): Required<ConnectionTestInput> {
  return {
    baseUrl: input.baseUrl || saved?.baseUrl || 'https://api.openai.com/v1',
    apiKey: input.apiKey?.trim() || saved?.apiKey || '',
    writingModel: input.writingModel || saved?.writingModel || 'gpt-4o',
  };
}
