// apps/desktop/src/renderer/pages/Knowledge.tsx
import { useEffect, useState } from 'react';
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
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-800">知识库</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          + 新建知识库
        </button>
      </div>

      {showCreate && (
        <div className="mb-6 border border-slate-200 rounded-lg p-4 bg-slate-50">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mb-2"
            placeholder="知识库名称"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mb-3"
            placeholder="简短描述（可选）"
          />
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">创建</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm">取消</button>
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {bases.map((kb) => (
          <KnowledgeCard key={kb.id} kb={kb} onDelete={deleteBase} />
        ))}
        {bases.length === 0 && !showCreate && (
          <div className="text-center py-12 text-slate-400">暂无知识库，点击上方按钮创建</div>
        )}
      </div>
    </div>
  );
}
