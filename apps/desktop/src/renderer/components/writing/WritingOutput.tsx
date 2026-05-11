import type { SectionOutput } from '@app/core';
import { Bot, CheckCircle2, CircleDashed, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

export function WritingOutput({
  sections,
  currentSectionIndex,
  progress,
  fullText,
}: {
  sections: SectionOutput[];
  currentSectionIndex: number;
  progress: number;
  fullText: string;
}) {
  if (sections.length === 0) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <Sparkles className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm text-slate-500">等待生成内容</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-1.5 rounded-full bg-blue-600 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {sections.map((section) => {
        const isActive = section.sectionIndex === currentSectionIndex && !fullText;
        const isComplete = Boolean(fullText) || section.sectionIndex < currentSectionIndex;

        return (
          <article
            key={section.sectionIndex}
            className={cn(
              'rounded-lg border bg-white shadow-sm',
              isActive ? 'border-blue-200 ring-2 ring-blue-50' : 'border-slate-200',
            )}
          >
            <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    isComplete ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700',
                  )}
                >
                  {isComplete ? <CheckCircle2 className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-slate-900">
                    {section.title}
                  </h2>
                  <p className="text-xs text-slate-400">Section {section.sectionIndex + 1}</p>
                </div>
              </div>
              {isActive && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700">
                  <CircleDashed className="h-3.5 w-3.5 animate-spin" />
                  写作中
                </span>
              )}
            </header>
            <div className="px-5 py-4">
              <div className="whitespace-pre-wrap text-[15px] leading-8 text-slate-700">
                {section.content}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
