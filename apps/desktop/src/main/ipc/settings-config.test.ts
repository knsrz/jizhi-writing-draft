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
      baseUrl: 'https://api.example.test/v1',
      apiKey: 'saved-key',
      writingModel: 'gpt-test',
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
});
