import { describe, expect, it } from 'vitest';
import { getWritingStageMessage } from './writing-progress';

describe('getWritingStageMessage', () => {
  it('turns pipeline progress payloads into user-facing stage copy', () => {
    expect(getWritingStageMessage({ status: 'writing', title: '背景说明' })).toBe(
      '正在撰写「背景说明」',
    );
    expect(getWritingStageMessage({ status: 'fact-checking' })).toBe('正在核对引用资料');
    expect(getWritingStageMessage({ percent: 90 })).toBe('正在整理最终稿');
  });
});
