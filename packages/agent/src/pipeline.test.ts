import { generateText, streamText } from 'ai';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runPipeline } from './pipeline';

vi.mock('ai', () => ({
  generateText: vi.fn(),
  streamText: vi.fn(),
}));

const confirmedPlan = {
  goal: '形成一份季度总结',
  audience: '部门负责人',
  sections: [
    {
      title: '工作概览',
      targetWords: 500,
      keywords: ['季度', '成果'],
      needsRAG: false,
    },
  ],
  totalWordBudget: 500,
  missingInfo: [],
};

describe('runPipeline', () => {
  beforeEach(() => {
    vi.mocked(generateText).mockReset();
    vi.mocked(streamText).mockReset();
  });

  it('uses a confirmed plan without generating a new one', async () => {
    vi.mocked(streamText).mockReturnValue({
      textStream: textStream(['初稿内容']),
    } as unknown as ReturnType<typeof streamText>);
    vi.mocked(generateText).mockResolvedValue({ text: '润色后的内容' } as Awaited<
      ReturnType<typeof generateText>
    >);

    const callbacks = {
      onPlanReady: vi.fn(),
      onSectionStart: vi.fn(),
      onSectionWriting: vi.fn(),
      onSectionFactCheck: vi.fn(),
      onSectionPolish: vi.fn(),
      onProgress: vi.fn(),
      onError: vi.fn(),
    };

    const fullText = await runPipeline(
      {
        type: 'summary',
        topic: '季度总结',
        targetWords: 800,
        style: 'formal',
        plan: confirmedPlan,
      },
      {} as never,
      null,
      callbacks,
    );

    expect(callbacks.onPlanReady).toHaveBeenCalledWith(confirmedPlan);
    expect(streamText).toHaveBeenCalledOnce();
    expect(generateText).toHaveBeenCalledOnce();
    expect(vi.mocked(generateText).mock.calls[0][0].prompt).toContain('待润色文段');
    expect(fullText).toContain('润色后的内容');
  });
});

async function* textStream(chunks: string[]): AsyncGenerator<string> {
  for (const chunk of chunks) {
    yield chunk;
  }
}
