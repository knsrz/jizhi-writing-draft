import { STYLE_LABELS, WRITING_TYPE_LABELS } from '@app/core';
import { Download, FileText, Loader2, Plus, RotateCcw, Square } from 'lucide-react';
import { WritingForm } from '../components/writing/WritingForm';
import { WritingOutput } from '../components/writing/WritingOutput';
import { WritingPlanPanel } from '../components/writing/WritingPlanPanel';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import { useWritingStore } from '../store/writing';

const statusLabels = {
  idle: '待开始',
  planning: '规划中',
  writing: '写作中',
  polishing: '润色中',
  done: '已完成',
  error: '出错',
};

export default function WritingPage() {
  const {
    status,
    type,
    style,
    targetWords,
    plan,
    sections,
    currentSectionIndex,
    progress,
    fullText,
    projectId,
    error,
    startWriting,
    reset,
  } = useWritingStore();

  const isActive = status === 'planning' || status === 'writing' || status === 'polishing';
  const showWorkbench = isActive || status === 'done' || status === 'error';

  return (
    <div className="flex min-h-full flex-col bg-[#f7f8fb] text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Writing desk
            </p>
            <h1 className="mt-1 text-xl font-semibold">极致写作</h1>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600">
              {WRITING_TYPE_LABELS[type]}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600">
              {STYLE_LABELS[style]}
            </span>
            <span
              className={cn(
                'rounded-full px-3 py-1.5',
                status === 'error'
                  ? 'bg-rose-50 text-rose-700'
                  : status === 'done'
                    ? 'bg-emerald-50 text-emerald-700'
                    : isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-slate-100 text-slate-600',
              )}
            >
              {statusLabels[status]}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        {!showWorkbench && (
          <div className="px-8 py-10">
            <WritingForm onStart={startWriting} />
          </div>
        )}

        {showWorkbench && (
          <div className="grid min-h-[calc(100vh-73px)] grid-cols-[300px_minmax(0,1fr)_280px] gap-6 px-6 py-6">
            <aside className="min-h-0 overflow-y-auto">
              {plan ? (
                <WritingPlanPanel plan={plan} currentSectionIndex={currentSectionIndex} />
              ) : (
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                    Plan
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    正在规划结构
                  </div>
                </div>
              )}
            </aside>

            <section className="min-w-0 overflow-y-auto pb-12">
              <div className="mx-auto max-w-[840px] space-y-4">
                <div className="rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                        Transcript
                      </p>
                      <h2 className="mt-1 text-lg font-semibold text-slate-900">生成内容</h2>
                    </div>
                    <div className="text-sm text-slate-500">{Math.round(progress)}%</div>
                  </div>
                </div>

                {status === 'error' ? (
                  <div className="rounded-lg border border-rose-200 bg-white p-6 text-rose-700">
                    <p className="font-medium">写作出错</p>
                    <p className="mt-2 text-sm leading-6">{error || '请检查模型配置后重试。'}</p>
                  </div>
                ) : (
                  <WritingOutput
                    sections={sections}
                    currentSectionIndex={currentSectionIndex}
                    progress={progress}
                    fullText={fullText}
                  />
                )}
              </div>
            </section>

            <aside className="min-h-0 overflow-y-auto">
              <div className="space-y-4">
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                    Run
                  </p>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">目标篇幅</span>
                      <span className="font-medium text-slate-800">
                        {targetWords.toLocaleString()} 字
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">已完成章节</span>
                      <span className="font-medium text-slate-800">{sections.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">状态</span>
                      <span className="font-medium text-slate-800">{statusLabels[status]}</span>
                    </div>
                  </div>
                </div>

                {isActive && (
                  <button
                    type="button"
                    onClick={reset}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <Square className="h-4 w-4" />
                    停止写作
                  </button>
                )}

                {status === 'done' && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => projectId && api.exportDocx(projectId)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                    >
                      <Download className="h-4 w-4" />
                      导出 Word
                    </button>
                    <button
                      type="button"
                      onClick={() => projectId && api.exportMarkdown(projectId)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      <FileText className="h-4 w-4" />
                      导出 Markdown
                    </button>
                    <button
                      type="button"
                      onClick={reset}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      <Plus className="h-4 w-4" />
                      新建写作
                    </button>
                  </div>
                )}

                {status === 'error' && (
                  <button
                    type="button"
                    onClick={reset}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    <RotateCcw className="h-4 w-4" />
                    重新开始
                  </button>
                )}
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
