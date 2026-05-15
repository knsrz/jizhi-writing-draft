import type { WritingPlan } from '@app/core';
import { Check, CircleDashed, FileSearch } from 'lucide-react';
import { cn } from '../../lib/utils';

export function WritingPlanPanel({
  plan,
  currentSectionIndex = -1,
}: {
  plan: WritingPlan;
  currentSectionIndex?: number;
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Plan</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-950">写作计划</h2>
      </div>

      <div className="space-y-3 text-sm">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/60">
          <div className="text-xs font-medium text-slate-400">目标</div>
          <p className="mt-1 leading-6 text-slate-700">{plan.goal}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/60">
          <div className="text-xs font-medium text-slate-400">读者</div>
          <p className="mt-1 leading-6 text-slate-700">{plan.audience}</p>
        </div>
      </div>

      <div className="space-y-2">
        {plan.sections.map((section, i) => {
          const isDone = i < currentSectionIndex;
          const isActive = i === currentSectionIndex;

          return (
            <div
              key={`${section.title}-${section.targetWords}-${section.keywords.join('|')}`}
              className={cn(
                'rounded-2xl border bg-white p-4 shadow-sm shadow-slate-200/50 transition-colors',
                isActive ? 'border-blue-300 bg-blue-50/70 ring-2 ring-blue-100' : 'border-slate-200/80',
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs',
                    isDone
                      ? 'bg-emerald-100 text-emerald-700'
                      : isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-500',
                  )}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-slate-800">{section.title}</p>
                    {isActive && (
                      <CircleDashed className="h-3.5 w-3.5 animate-spin text-blue-600" />
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>约 {section.targetWords} 字</span>
                    {section.needsRAG && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">
                        <FileSearch className="h-3 w-3" />
                        需资料
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {plan.missingInfo && plan.missingInfo.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <div className="text-xs font-medium text-amber-700">待补充</div>
          <p className="mt-1 text-sm leading-6 text-amber-800">{plan.missingInfo.join('；')}</p>
        </div>
      )}
    </div>
  );
}
