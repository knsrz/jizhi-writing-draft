import {
  createModelEntry,
  STYLE_LABELS,
  type Style,
  WORD_COUNT_OPTIONS,
  WRITING_TYPE_LABELS,
  type WritingType,
} from '@app/core';
import { Bot, FileText, Library, PenLine, SendHorizontal, SlidersHorizontal } from 'lucide-react';
import { useEffect } from 'react';
import { useKnowledgeStore } from '../../store/knowledge';
import { useSettingsStore } from '../../store/settings';
import { useWritingStore } from '../../store/writing';
import {
  getWordCountSelectValue,
  resolveWordCountSelection,
  sanitizeTargetWords,
} from './word-count';

const starterPrompts = [
  '写一份季度工作总结，突出关键成果、问题复盘和下季度计划',
  '写一份项目立项方案，包含背景、目标、路径、风险和预算',
  '把会议纪要整理成正式行动清单，按责任人与时间节点归类',
];

export function WritingForm({ onStart }: { onStart: () => void }) {
  const { topic, type, style, targetWords, knowledgeBaseId, setForm, status } = useWritingStore();
  const { bases, loadBases } = useKnowledgeStore();
  const { writing, loadSettings, selectWritingModel } = useSettingsStore();
  const isRunning = status !== 'idle' && status !== 'done' && status !== 'error';
  const activeWritingModelId =
    writing.baseUrl.trim() && writing.model.trim() ? createModelEntry('writing', writing).id : '';
  const activeModelInList = writing.models.some((model) => model.id === activeWritingModelId);

  useEffect(() => {
    loadBases();
    loadSettings();
  }, [loadBases, loadSettings]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            Draft composer
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-900">新建写作</h1>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-500">
          <PenLine className="h-4 w-4" />
          {WRITING_TYPE_LABELS[type]}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <label htmlFor="writing-topic" className="sr-only">
            你要写什么？
          </label>
          <textarea
            id="writing-topic"
            value={topic}
            onChange={(e) => setForm({ topic: e.target.value })}
            className="min-h-36 w-full resize-none border-0 bg-transparent text-base leading-7 text-slate-800 outline-none placeholder:text-slate-400"
            placeholder="输入写作需求、素材要点或目标读者..."
            disabled={isRunning}
          />

          <div className="mt-3 flex flex-wrap gap-2">
            {starterPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setForm({ topic: prompt })}
                disabled={isRunning}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
              >
                {prompt.slice(0, 18)}...
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border-b border-slate-100 p-4 lg:grid-cols-5">
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <FileText className="h-3.5 w-3.5" />
              写作类型
            </span>
            <select
              value={type}
              onChange={(e) => setForm({ type: e.target.value as WritingType })}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              disabled={isRunning}
            >
              {Object.entries(WRITING_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              语言风格
            </span>
            <select
              value={style}
              onChange={(e) => setForm({ style: e.target.value as Style })}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              disabled={isRunning}
            >
              {Object.entries(STYLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-500">篇幅</span>
            <select
              value={getWordCountSelectValue(targetWords)}
              onChange={(e) =>
                setForm({
                  targetWords: resolveWordCountSelection(e.target.value, targetWords),
                })
              }
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              disabled={isRunning}
            >
              {WORD_COUNT_OPTIONS.filter((opt) => opt.value > 0).map((opt) => (
                <option key={opt.label} value={opt.value}>
                  {opt.label}
                </option>
              ))}
              <option value="custom">自定义</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Bot className="h-3.5 w-3.5" />
              写作模型
            </span>
            <select
              value={activeWritingModelId}
              onChange={(e) => void selectWritingModel(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              disabled={isRunning || writing.models.length === 0}
            >
              {writing.models.length === 0 && <option value="">未配置</option>}
              {activeWritingModelId && !activeModelInList && (
                <option value={activeWritingModelId}>{writing.model}</option>
              )}
              {writing.models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Library className="h-3.5 w-3.5" />
              知识库
            </span>
            <select
              value={knowledgeBaseId || ''}
              onChange={(e) => setForm({ knowledgeBaseId: e.target.value || null })}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              disabled={isRunning}
            >
              <option value="">不使用</option>
              {bases.map((kb) => (
                <option key={kb.id} value={kb.id}>
                  {kb.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {getWordCountSelectValue(targetWords) === 'custom' && (
          <div className="border-b border-slate-100 px-4 py-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-500">自定义字数</span>
              <input
                type="number"
                min={100}
                max={50000}
                value={targetWords}
                onChange={(e) =>
                  setForm({ targetWords: sanitizeTargetWords(Number(e.target.value)) })
                }
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                disabled={isRunning}
              />
            </label>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 p-4">
          <div className="text-sm text-slate-500">
            {targetWords.toLocaleString()} 字 · {STYLE_LABELS[style]} ·{' '}
            {writing.model || '未选择模型'} · {bases.length} 个知识库可选
          </div>
          <button
            type="button"
            onClick={onStart}
            disabled={!topic.trim() || isRunning}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRunning ? '规划中' : '生成规划'}
            <SendHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
