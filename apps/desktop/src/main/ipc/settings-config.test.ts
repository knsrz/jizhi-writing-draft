import { describe, expect, it } from 'vitest';
import { buildConnectionTestConfig } from './settings-config';

describe('buildConnectionTestConfig', () => {
  it('uses the saved api key when the renderer only supplies editable fields', () => {
    const config = buildConnectionTestConfig(
      {
        baseUrl: 'https://api.example.test/v1',
        apiKey: '',
        writingModel: 'gpt-test',
      },
      {
        provider: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'saved-key',
        writingModel: 'gpt-4o',
        embeddingModel: 'text-embedding-3-small',
      },
    );

    expect(config).toEqual({
      kind: 'writing',
      baseUrl: 'https://api.example.test/v1',
      apiKey: 'saved-key',
      model: 'gpt-test',
    });
  });

  it('prefers a newly supplied api key over the saved one', () => {
    const config = buildConnectionTestConfig(
      {
        baseUrl: 'https://api.example.test/v1',
        apiKey: 'fresh-key',
        writingModel: 'gpt-test',
      },
      {
        provider: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'saved-key',
        writingModel: 'gpt-4o',
        embeddingModel: 'text-embedding-3-small',
      },
    );

    expect(config.apiKey).toBe('fresh-key');
  });

  it('keeps embedding connection tests on the embedding model kind', () => {
    const config = buildConnectionTestConfig(
      {
        kind: 'embedding',
        baseUrl: 'https://openrouter.ai/api/v1',
        apiKey: '',
        model: 'qwen/qwen3-embedding-4b',
      },
      {
        provider: 'openrouter',
        baseUrl: 'https://openrouter.ai/api/v1',
        apiKey: 'saved-key',
        writingModel: 'openai/gpt-4o',
        embeddingModel: 'text-embedding-3-small',
      },
    );

    expect(config).toEqual({
      kind: 'embedding',
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey: 'saved-key',
      model: 'qwen/qwen3-embedding-4b',
    });
  });
});
