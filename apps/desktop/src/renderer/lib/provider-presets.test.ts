import { describe, expect, it } from 'vitest';
import {
  applyEmbeddingProviderPreset,
  applyProviderPreset,
  applyWritingProviderPreset,
  EMBEDDING_PROVIDER_PRESETS,
  getProviderPreset,
  PROVIDER_PRESETS,
  WRITING_PROVIDER_PRESETS,
} from './provider-presets';

describe('provider presets', () => {
  it('applies a preset with provider, endpoint, and model defaults', () => {
    const preset = getProviderPreset('deepseek');

    expect(preset?.baseUrl).toBe('https://api.deepseek.com');
    expect(applyProviderPreset('deepseek')).toEqual({
      provider: 'deepseek',
      baseUrl: 'https://api.deepseek.com',
      writingModel: 'deepseek-v4-flash',
      embeddingModel: '',
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
    expect(WRITING_PROVIDER_PRESETS.at(-1)?.id).toBe('custom');
    expect(EMBEDDING_PROVIDER_PRESETS.at(-1)?.id).toBe('custom');
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

  it('limits embedding presets to providers with embedding models', () => {
    expect(WRITING_PROVIDER_PRESETS.some((preset) => preset.id === 'deepseek')).toBe(true);
    expect(EMBEDDING_PROVIDER_PRESETS.some((preset) => preset.id === 'deepseek')).toBe(false);
    expect(EMBEDDING_PROVIDER_PRESETS.map((preset) => preset.id)).toContain('voyageai');
  });

  it('uses the Gemini OpenAI-compatible endpoint for both writing and embedding presets', () => {
    expect(applyWritingProviderPreset('gemini')).toEqual({
      provider: 'gemini',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
      model: 'gemini-2.5-flash',
    });
    expect(applyEmbeddingProviderPreset('gemini')).toEqual({
      provider: 'gemini',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
      model: 'gemini-embedding-001',
    });
  });

  it('adds documentation and model links for every built-in provider', () => {
    const builtIns = PROVIDER_PRESETS.filter((preset) => preset.id !== 'custom');

    expect(builtIns.length).toBeGreaterThan(12);
    for (const preset of builtIns) {
      expect(preset.links.docs).toMatch(/^https?:\/\//);
      expect(preset.links.models).toMatch(/^https?:\/\//);
    }
  });
});
