// apps/desktop/src/renderer/components/knowledge/KnowledgeCard.tsx
import type { KnowledgeBase } from '@app/core';
import { Folder, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function KnowledgeCard({ kb, onDelete }: { kb: KnowledgeBase; onDelete: (id: string) => void }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/60 transition hover:border-blue-200 hover:shadow-md hover:shadow-blue-100/60">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Folder className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-medium text-slate-800">{kb.name}</h3>
            <p className="text-sm text-slate-500 mt-0.5">{kb.description || '暂无描述'}</p>
          </div>
        </div>
        <button
          onClick={() => onDelete(kb.id)}
          className="text-xs text-red-400 hover:text-red-600"
        >
          删除
        </button>
      </div>
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
        <span className="text-xs text-slate-400">
          {kb.documentCount} 个文档 · {new Date(kb.updatedAt).toLocaleDateString('zh-CN')}
        </span>
        <Link
          to={`/knowledge/${kb.id}`}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
        >
          管理 <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
