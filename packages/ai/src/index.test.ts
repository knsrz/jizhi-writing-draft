import { embedMany, generateText } from 'ai';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { testConnection } from './index';

vi.mock('ai', () => ({
  embedMany: vi.fn(),
  generateText: vi.fn(),
}));

describe('testConnection', () => {
  beforeEach(() => {
    vi.mocked(embedMany).mockReset();
    vi.mocked(generateText).mockReset();
  });

  it('uses the chat endpoint for writing models', async () => {
    vi.mocked(generateText).mockResolvedValue({ text: 'ok' } as Awaited<
      ReturnType<typeof generateText>
    >);

    const result = await testConnection(
      'https://api.example.test/v1',
      'key',
      'gpt-test',
      'writing',
    );

    expect(result.success).toBe(true);
    expect(generateText).toHaveBeenCalledOnce();
    expect(embedMany).not.toHaveBeenCalled();
  });

  it('uses the embeddings endpoint for embedding models', async () => {
    vi.mocked(embedMany).mockResolvedValue({
      embeddings: [[0.1, 0.2]],
      usage: { tokens: 1 },
    } as Awaited<ReturnType<typeof embedMany>>);

    const result = await testConnection(
      'https://openrouter.ai/api/v1',
      'key',
      'qwen/qwen3-embedding-4b',
      'embedding',
    );

    expect(result.success).toBe(true);
    expect(embedMany).toHaveBeenCalledOnce();
    expect(generateText).not.toHaveBeenCalled();
  });
});
