// apps/desktop/src/renderer/pages/Knowledge.tsx
import { useEffect, useState } from 'react';
import { Database, Plus, Search } from 'lucide-react';
import { useKnowledgeStore } from '../store/knowledge';
import { KnowledgeCard } from '../components/knowledge/KnowledgeCard';

export default function KnowledgePage() {
  const { bases, loadBases, createBase, deleteBase } = useKnowledgeStore();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => { loadBases(); }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    await createBase(name, description);
    setName('');
    setDescription('');
    setShowCreate(false);
  };

  return (
    <div className="min-h-full bg-[#eef4fb] px-8 py-8 text-slate-950">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
              Knowledge Base
            </div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">知识库</h1>
            <p className="mt-2 text-sm text-slate-500">管理可供写作 Agent 检索的本地资料。</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm shadow-slate-200/60 sm:flex">
              <Search className="h-4 w-4" />
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
            >
              <span className="inline-flex items-center gap-2">
                <Plus className="h-4 w-4" />
                新建知识库
              </span>
            </button>
          </div>
        </div>

        {showCreate && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/60">
            <div className="space-y-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                placeholder="知识库名称"
              />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                placeholder="简短描述（可选）"
              />
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={handleCreate} className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white">创建</button>
              <button onClick={() => setShowCreate(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm">取消</button>
            </div>
          </div>
        )}

        <div className="grid gap-3">
          {bases.map((kb) => (
            <KnowledgeCard key={kb.id} kb={kb} onDelete={deleteBase} />
          ))}
          {bases.length === 0 && !showCreate && (
            <div className="rounded-2xl border border-dashed border-blue-200 bg-white/80 px-6 py-14 text-center text-slate-500 shadow-sm shadow-slate-200/60">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Database className="h-5 w-5" />
              </div>
              <div className="text-sm font-medium">暂无知识库</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
