export interface ConnectionTestInput {
  kind?: 'writing' | 'embedding';
  baseUrl: string;
  apiKey?: string;
  model?: string;
  writingModel?: string;
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
): { kind: 'writing' | 'embedding'; baseUrl: string; apiKey: string; model: string } {
  const kind = input.kind ?? 'writing';
  const inputModel = input.model || input.writingModel;
  const savedModel = kind === 'embedding' ? saved?.embeddingModel : saved?.writingModel;

  return {
    kind,
    baseUrl: input.baseUrl || saved?.baseUrl || 'https://api.openai.com/v1',
    apiKey: input.apiKey?.trim() || saved?.apiKey || '',
    model: inputModel || savedModel || (kind === 'embedding' ? 'text-embedding-3-small' : 'gpt-4o'),
  };
}
