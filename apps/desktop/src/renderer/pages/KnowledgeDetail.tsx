// apps/desktop/src/renderer/pages/KnowledgeDetail.tsx

import type { Document } from '@app/core';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useKnowledgeStore } from '../store/knowledge';

const STATUS_LABELS: Record<string, string> = {
  pending: '等待中',
  parsing: '解析中',
  chunking: '切片中',
  embedding: '向量化中',
  ready: '就绪',
  error: '错误',
};

export default function KnowledgeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    bases,
    documents,
    uploadProgress,
    loadBases,
    loadDocuments,
    uploadDocument,
    deleteDocument,
  } = useKnowledgeStore();

  useEffect(() => {
    loadBases();
    if (id) loadDocuments(id);
  }, [id, loadBases, loadDocuments]);

  const kb = bases.find((b) => b.id === id);

  if (!kb) return <div className="min-h-full bg-[#eef4fb] px-8 py-8 text-slate-400">知识库不存在</div>;

  return (
    <div className="min-h-full bg-[#eef4fb] px-8 py-8">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => navigate('/knowledge')}
          className="mb-5 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          &larr; 返回
        </button>
        <h1 className="mb-2 text-3xl font-semibold tracking-tight text-slate-950">{kb.name}</h1>
        <p className="mb-8 text-sm text-slate-500">{kb.description}</p>

        <div className="mb-6">
          <button
            type="button"
            onClick={() => id && uploadDocument(id)}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
          >
            上传文档
          </button>
        </div>

        {uploadProgress && (
          <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            正在处理 {uploadProgress.fileName}: {uploadProgress.stage}
            {uploadProgress.totalChunks > 0 &&
              ` (${uploadProgress.completedChunks}/${uploadProgress.totalChunks})`}
          </div>
        )}

        <div className="space-y-2">
          {documents.map((doc: Document) => (
            <div
              key={doc.id}
              className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-sm shadow-slate-200/60"
            >
              <div>
                <span className="text-sm font-medium text-slate-700">{doc.fileName}</span>
                <span className="ml-3 text-xs text-slate-400">{doc.fileType.toUpperCase()}</span>
                {doc.status === 'error' && doc.errorMessage && (
                  <p className="mt-1 max-w-xl text-xs text-red-600">{doc.errorMessage}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    doc.status === 'ready'
                      ? 'bg-green-100 text-green-700'
                      : doc.status === 'error'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {STATUS_LABELS[doc.status] || doc.status}
                </span>
                <span className="text-xs text-slate-400">{doc.chunkCount} 切片</span>
                <button
                  type="button"
                  onClick={() => id && deleteDocument(id, doc.id)}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
          {documents.length === 0 && !uploadProgress && (
            <div className="py-12 text-center text-slate-400">暂无文档，点击上传</div>
          )}
        </div>
      </div>
    </div>
  );
}
