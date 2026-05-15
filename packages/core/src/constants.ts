// packages/core/src/constants.ts
import type { Style, WritingStatus, WritingType } from './types.js';

export const WRITING_TYPE_LABELS: Record<WritingType, string> = {
  summary: '工作总结',
  report: '调研报告',
  proposal: '项目方案',
  minutes: '会议纪要',
  notice: '通知公告',
  email: '商务邮件',
  promotional: '宣传稿',
  policy: '制度文档',
  bidding: '招投标材料',
  custom: '自定义文档',
};

export const STYLE_LABELS: Record<Style, string> = {
  formal: '正式',
  concise: '简洁',
  professional: '专业',
  friendly: '亲和',
  promotional: '宣传',
  government: '公文',
};

export const WRITING_STATUS_LABELS: Record<WritingStatus | 'idle', string> = {
  idle: '待开始',
  draft: '草稿',
  planning: '规划中',
  reviewing: '待确认',
  writing: '写作中',
  polishing: '润色中',
  done: '已完成',
  error: '出错',
};

export const WORD_COUNT_OPTIONS = [
  { label: '短篇 (~800字)', value: 800 },
  { label: '中等 (~2000字)', value: 2000 },
  { label: '长篇 (~5000字)', value: 5000 },
  { label: '自定义', value: -1 },
] as const;

export const APP_DATA_DIR = 'writing-app';
