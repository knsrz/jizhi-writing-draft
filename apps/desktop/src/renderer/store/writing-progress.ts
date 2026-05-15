export interface WritingProgressPayload {
  percent?: number;
  status?: string;
  title?: string;
}

export function getWritingStageMessage(payload: WritingProgressPayload): string | null {
  switch (payload.status) {
    case 'planning':
      return '正在生成写作规划';
    case 'reviewing':
      return '规划已生成，等待确认';
    case 'writing':
      return payload.title ? `正在撰写「${payload.title}」` : '正在撰写正文';
    case 'fact-checking':
      return '正在核对引用资料';
    case 'polishing':
      return '正在润色章节';
    default:
      if (typeof payload.percent === 'number' && payload.percent >= 90 && payload.percent < 100) {
        return '正在整理最终稿';
      }
      if (typeof payload.percent === 'number' && payload.percent >= 100) {
        return '已完成';
      }
      return null;
  }
}
