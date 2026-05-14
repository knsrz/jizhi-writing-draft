import type { WritingPlan } from '@app/core';
import { addPlanSection, removePlanSection, updatePlanSection, updateWritingPlan } from '@app/core';
import { FileSearch, Plus, Trash2 } from 'lucide-react';

export function WritingPlanEditor({
  plan,
  onChange,
}: {
  plan: WritingPlan;
  onChange: (plan: WritingPlan) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
          Review plan
        </p>
        <h2 className="mt-1 text-lg font-semibold text-slate-900">确认写作规划</h2>
        <p className="mt-1 text-sm text-slate-500">确认前可以调整目标、读者和章节结构。</p>
      </div>

      <div className="space-y-5 p-5">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">写作目标</span>
          <textarea
            value={plan.goal}
            onChange={(event) => onChange(updateWritingPlan(plan, { goal: event.target.value }))}
            className="min-h-20 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">目标读者</span>
          <textarea
            value={plan.audience}
            onChange={(event) =>
              onChange(updateWritingPlan(plan, { audience: event.target.value }))
            }
            className="min-h-16 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">章节安排</h3>
              <p className="mt-1 text-xs text-slate-500">
                当前预算 {plan.totalWordBudget.toLocaleString()} 字
              </p>
            </div>
            <button
              type="button"
              onClick={() => onChange(addPlanSection(plan))}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Plus className="h-4 w-4" />
              添加章节
            </button>
          </div>

          {plan.sections.map((section, index) => (
            <div
              key={`${section.title}-${section.targetWords}-${section.keywords.join('|')}-${section.needsRAG}`}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-medium text-white">
                  {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => onChange(removePlanSection(plan, index))}
                  disabled={plan.sections.length <= 1}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="删除章节"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_140px]">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-slate-500">标题</span>
                  <input
                    type="text"
                    value={section.title}
                    onChange={(event) =>
                      onChange(updatePlanSection(plan, index, { title: event.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-slate-500">目标字数</span>
                  <input
                    type="number"
                    min={100}
                    value={section.targetWords}
                    onChange={(event) =>
                      onChange(
                        updatePlanSection(plan, index, {
                          targetWords: Number(event.target.value),
                        }),
                      )
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-1.5 block text-xs font-medium text-slate-500">
                    检索关键词
                  </span>
                  <input
                    type="text"
                    value={section.keywords.join('，')}
                    onChange={(event) =>
                      onChange(
                        updatePlanSection(plan, index, {
                          keywords: parseKeywords(event.target.value),
                        }),
                      )
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="用逗号分隔"
                  />
                </label>
              </div>

              <label className="mt-3 inline-flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={section.needsRAG}
                  onChange={(event) =>
                    onChange(updatePlanSection(plan, index, { needsRAG: event.target.checked }))
                  }
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="inline-flex items-center gap-1.5">
                  <FileSearch className="h-4 w-4" />
                  使用知识库资料
                </span>
              </label>
            </div>
          ))}
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">待补充信息</span>
          <textarea
            value={plan.missingInfo?.join('\n') ?? ''}
            onChange={(event) =>
              onChange(
                updateWritingPlan(plan, {
                  missingInfo: event.target.value
                    .split('\n')
                    .map((item) => item.trim())
                    .filter(Boolean),
                }),
              )
            }
            className="min-h-16 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            placeholder="每行一条，可留空"
          />
        </label>
      </div>
    </div>
  );
}

function parseKeywords(value: string): string[] {
  return value
    .split(/[，,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}
