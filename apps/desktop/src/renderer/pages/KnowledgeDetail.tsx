// apps/desktop/src/renderer/pages/KnowledgeDetail.tsx
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useKnowledgeStore } from '../store/knowledge';
import type { Document } from '@app/core';

const STATUS_LABELS: Record<string, string> = {
  pending: '等待中', parsing: '解析中', chunking: '切片中', embedding: '向量化中', ready: '就绪', error: '错误',
};

export default function KnowledgeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { bases, documents, uploadProgress, loadBases, loadDocuments, uploadDocument } = useKnowledgeStore();

  useEffect(() => {
    loadBases();
    if (id) loadDocuments(id);
  }, [id]);

  const kb = bases.find((b) => b.id === id);

  if (!kb) return <div className="p-8 text-slate-400">知识库不存在</div>;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <button onClick={() => navigate('/knowledge')} className="text-sm text-blue-600 mb-4 block">&larr; 返回</button>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">{kb.name}</h1>
      <p className="text-sm text-slate-500 mb-8">{kb.description}</p>

      <div className="mb-6">
        <button
          onClick={() => id && uploadDocument(id)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          上传文档
        </button>
      </div>

      {uploadProgress && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
          正在处理 {uploadProgress.fileName}: {uploadProgress.stage}
          {uploadProgress.totalChunks > 0 && ` (${uploadProgress.completedChunks}/${uploadProgress.totalChunks})`}
        </div>
      )}

      <div className="space-y-2">
        {documents.map((doc: Document) => (
          <div key={doc.id} className="flex items-center justify-between px-4 py-3 border border-slate-200 rounded-lg">
            <div>
              <span className="text-sm font-medium text-slate-700">{doc.fileName}</span>
              <span className="ml-3 text-xs text-slate-400">{doc.fileType.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-0.5 rounded ${
                doc.status === 'ready' ? 'bg-green-100 text-green-700' :
                doc.status === 'error' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {STATUS_LABELS[doc.status] || doc.status}
              </span>
              <span className="text-xs text-slate-400">{doc.chunkCount} 切片</span>
            </div>
          </div>
        ))}
        {documents.length === 0 && !uploadProgress && (
          <div className="text-center py-12 text-slate-400">暂无文档，点击上传</div>
        )}
      </div>
    </div>
  );
}
