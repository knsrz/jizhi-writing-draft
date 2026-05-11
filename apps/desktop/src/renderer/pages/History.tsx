import { useEffect, useState } from 'react';
import type { WritingProject } from '@app/core';
import { api } from '../lib/api';
import { WRITING_TYPE_LABELS } from '@app/core';

export default function HistoryPage() {
  const [projects, setProjects] = useState<WritingProject[]>([]);

  useEffect(() => {
    api.listProjects().then((ps) => setProjects(ps as WritingProject[]));
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-8">写作历史</h1>
      {projects.length === 0 ? (
        <div className="text-center py-12 text-slate-400">暂无写作记录</div>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <div key={p.id} className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-slate-800">{p.title}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-400">{WRITING_TYPE_LABELS[p.writingType]}</span>
                    <span className="text-xs text-slate-400">{p.targetWords}字</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      p.status === 'done' ? 'bg-green-100 text-green-700' :
                      p.status === 'error' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>{p.status}</span>
                  </div>
                </div>
                <span className="text-xs text-slate-400">{new Date(p.createdAt).toLocaleString('zh-CN')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
