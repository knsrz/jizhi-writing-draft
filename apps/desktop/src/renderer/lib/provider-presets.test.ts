import { describe, expect, it } from 'vitest';
import {
  applyEmbeddingProviderPreset,
  applyProviderPreset,
  applyWritingProviderPreset,
  getProviderPreset,
  PROVIDER_PRESETS,
} from './provider-presets';

describe('provider presets', () => {
  it('applies a preset with provider, endpoint, and model defaults', () => {
    const preset = getProviderPreset('deepseek');

    expect(preset?.baseUrl).toBe('https://api.deepseek.com');
    expect(applyProviderPreset('deepseek')).toEqual({
      provider: 'deepseek',
      baseUrl: 'https://api.deepseek.com',
      writingModel: 'deepseek-chat',
      embeddingModel: 'text-embedding-3-small',
    });
  });

  it('keeps the current values when the custom preset is selected', () => {
    const current = {
      provider: 'custom',
      baseUrl: 'http://localhost:11434/v1',
      writingModel: 'local-writer',
      embeddingModel: 'local-embed',
    };

    expect(applyProviderPreset('custom', current)).toEqual(current);
  });

  it('keeps presets ordered with custom at the end', () => {
    expect(PROVIDER_PRESETS.at(-1)?.id).toBe('custom');
  });

  it('applies only writing fields for the writing API preset', () => {
    expect(applyWritingProviderPreset('siliconflow')).toEqual({
      provider: 'siliconflow',
      baseUrl: 'https://api.siliconflow.cn/v1',
      model: 'Qwen/Qwen3-235B-A22B-Instruct-2507',
    });
  });

  it('applies only embedding fields for the embedding API preset', () => {
    expect(applyEmbeddingProviderPreset('siliconflow')).toEqual({
      provider: 'siliconflow',
      baseUrl: 'https://api.siliconflow.cn/v1',
      model: 'BAAI/bge-m3',
    });
  });
});
