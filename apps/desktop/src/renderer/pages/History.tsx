import type { WritingProject } from '@app/core';
import { WRITING_STATUS_LABELS, WRITING_TYPE_LABELS } from '@app/core';
import { FileClock, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function HistoryPage() {
  const [projects, setProjects] = useState<WritingProject[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.listProjects().then((ps) => setProjects(ps as WritingProject[]));
  }, []);

  return (
    <div className="min-h-full bg-[#eef4fb] px-8 py-8 text-slate-950">
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
            History
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">写作历史</h1>
          <p className="mt-2 text-sm text-slate-500">查看已生成、修订和导出的写作项目。</p>
        </header>

        {projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-blue-200 bg-white/80 px-6 py-14 text-center text-slate-500 shadow-sm shadow-slate-200/60">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <FileClock className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-700">暂无写作记录</p>
            <p className="mt-1 text-xs text-slate-500">完成一次写作后会在这里出现。</p>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => navigate(`/history/${p.id}`)}
                className="w-full rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-sm shadow-slate-200/60 transition hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-md hover:shadow-blue-100/60"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-800">{p.title}</h3>
                      <div className="mt-1 flex items-center gap-3">
                        <span className="text-xs text-slate-400">
                          {WRITING_TYPE_LABELS[p.writingType]}
                        </span>
                        <span className="text-xs text-slate-400">{p.targetWords}字</span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-xs ${
                            p.status === 'done'
                              ? 'bg-green-100 text-green-700'
                              : p.status === 'error'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {WRITING_STATUS_LABELS[p.status]}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(p.createdAt).toLocaleString('zh-CN')}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
