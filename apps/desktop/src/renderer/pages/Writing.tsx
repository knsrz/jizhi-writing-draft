import { STYLE_LABELS, WRITING_STATUS_LABELS, WRITING_TYPE_LABELS } from '@app/core';
import {
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Plus,
  RotateCcw,
  Sparkles,
  Square,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { WritingForm } from '../components/writing/WritingForm';
import { WritingOutput } from '../components/writing/WritingOutput';
import { WritingPlanEditor } from '../components/writing/WritingPlanEditor';
import { WritingPlanPanel } from '../components/writing/WritingPlanPanel';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import { useWritingStore } from '../store/writing';
import { shouldLoadHistoryProject } from './writing-navigation';

export default function WritingPage() {
  const navigate = useNavigate();
  const { projectId: routeProjectId } = useParams();
  const [revisionInstruction, setRevisionInstruction] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const loadedRouteProjectId = useRef<string | null>(null);
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
    stageMessage,
    stageStartedAt,
    updatePlan,
    startWriting,
    confirmPlan,
    loadProject,
    revise,
    reset,
  } = useWritingStore();

  const isActive = status === 'planning' || status === 'writing' || status === 'polishing';
  const showWorkbench =
    isActive || status === 'reviewing' || status === 'done' || status === 'error';
  const isRevising = status === 'polishing';
  const showSlowStageHint = isActive && stageStartedAt !== null && now - stageStartedAt > 30_000;

  useEffect(() => {
    if (!routeProjectId) {
      loadedRouteProjectId.current = null;
      return;
    }
    if (!shouldLoadHistoryProject(routeProjectId, loadedRouteProjectId.current)) return;
    loadedRouteProjectId.current = routeProjectId;
    void loadProject(routeProjectId);
  }, [loadProject, routeProjectId]);

  useEffect(() => {
    if (routeProjectId || status !== 'done' || !projectId) return;
    navigate(`/history/${projectId}`, { replace: true });
  }, [navigate, projectId, routeProjectId, status]);

  useEffect(() => {
    if (!isActive) return;
    const timer = window.setInterval(() => setNow(Date.now()), 5000);
    return () => window.clearInterval(timer);
  }, [isActive]);

  const handleNewWriting = () => {
    setRevisionInstruction('');
    reset({ clearForm: true });
    navigate('/');
  };

  const handleReturnToDraft = () => {
    setRevisionInstruction('');
    reset();
    navigate('/');
  };

  const handleRevise = () => {
    const instruction = revisionInstruction.trim();
    if (!instruction || isRevising) return;
    void revise(instruction).then(() => {
      if (useWritingStore.getState().status === 'done') setRevisionInstruction('');
    });
  };

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
              {WRITING_STATUS_LABELS[status]}
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
                    <div className="text-right text-sm text-slate-500">
                      <div>{Math.round(progress)}%</div>
                      {stageMessage && (
                        <div className="mt-1 max-w-72 text-xs leading-5 text-slate-400">
                          {stageMessage}
                        </div>
                      )}
                    </div>
                  </div>
                  {showSlowStageHint && (
                    <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
                      当前阶段耗时较长，模型仍在处理；如果长时间没有新内容，可以停止后重试。
                    </div>
                  )}
                </div>

                {status === 'reviewing' && plan ? (
                  <WritingPlanEditor plan={plan} onChange={updatePlan} />
                ) : status === 'error' ? (
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
                      <span className="font-medium text-slate-800">
                        {WRITING_STATUS_LABELS[status]}
                      </span>
                    </div>
                    {stageMessage && (
                      <div className="rounded-md bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500">
                        {stageMessage}
                      </div>
                    )}
                  </div>
                </div>

                {isActive && (
                  <button
                    type="button"
                    onClick={handleReturnToDraft}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <Square className="h-4 w-4" />
                    停止写作
                  </button>
                )}

                {(status === 'done' || status === 'polishing') && projectId && (
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                      Revise
                    </p>
                    <textarea
                      value={revisionInstruction}
                      onChange={(event) => setRevisionInstruction(event.target.value)}
                      disabled={isRevising}
                      className="mt-3 min-h-24 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                      placeholder="告诉 Agent 继续修改，例如：语气更正式，压缩到 1000 字，补充风险分析..."
                    />
                    <button
                      type="button"
                      onClick={handleRevise}
                      disabled={!revisionInstruction.trim() || isRevising}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isRevising ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      {isRevising ? '修改中' : '让 Agent 继续修改'}
                    </button>
                  </div>
                )}

                {status === 'reviewing' && plan && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={confirmPlan}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      确认并开始写作
                    </button>
                    <button
                      type="button"
                      onClick={handleReturnToDraft}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      <RotateCcw className="h-4 w-4" />
                      返回修改目标
                    </button>
                  </div>
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
                      onClick={handleNewWriting}
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
                    onClick={handleReturnToDraft}
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
