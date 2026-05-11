import { describe, expect, it } from 'vitest';
import { hasUsableApiConfig } from './writing-config';

describe('hasUsableApiConfig', () => {
  it('rejects missing API configuration before a writing project is created', () => {
    expect(hasUsableApiConfig(null)).toBe(false);
  });

  it('rejects saved model settings without a decrypted api key', () => {
    expect(
      hasUsableApiConfig({
        provider: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: '',
        model: 'gpt-4o',
      }),
    ).toBe(false);
  });

  it('accepts complete API configuration', () => {
    expect(
      hasUsableApiConfig({
        provider: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-test',
        model: 'gpt-4o',
      }),
    ).toBe(true);
  });
});
