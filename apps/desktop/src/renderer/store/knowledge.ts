import type { Document, KnowledgeBase, UploadProgress } from '@app/core';
import { create } from 'zustand';
import { api } from '../lib/api';

interface KnowledgeState {
  bases: KnowledgeBase[];
  currentBase: KnowledgeBase | null;
  documents: Document[];
  uploadProgress: UploadProgress | null;
  loadBases: () => Promise<void>;
  createBase: (name: string, description: string) => Promise<void>;
  deleteBase: (id: string) => Promise<void>;
  loadDocuments: (kbId: string) => Promise<void>;
  deleteDocument: (kbId: string, docId: string) => Promise<void>;
  uploadDocument: (kbId: string) => Promise<void>;
  setCurrentBase: (base: KnowledgeBase | null) => void;
}

export const useKnowledgeStore = create<KnowledgeState>((set) => ({
  bases: [],
  currentBase: null,
  documents: [],
  uploadProgress: null,

  loadBases: async () => {
    const bases = await api.listKnowledgeBases();
    set({ bases: bases as KnowledgeBase[] });
  },

  createBase: async (name, description) => {
    await api.createKnowledgeBase(name, description);
    const bases = await api.listKnowledgeBases();
    set({ bases: bases as KnowledgeBase[] });
  },

  deleteBase: async (id) => {
    await api.deleteKnowledgeBase(id);
    const bases = await api.listKnowledgeBases();
    set({ bases: bases as KnowledgeBase[] });
  },

  loadDocuments: async (kbId) => {
    const docs = await api.listDocuments(kbId);
    set({ documents: docs as Document[] });
  },

  deleteDocument: async (kbId, docId) => {
    await api.deleteDocument(docId);
    const docs = await api.listDocuments(kbId);
    const bases = await api.listKnowledgeBases();
    set({ documents: docs as Document[], bases: bases as KnowledgeBase[] });
  },

  uploadDocument: async (kbId) => {
    const cleanup = api.onUploadProgress((p) => set({ uploadProgress: p as UploadProgress }));
    try {
      await api.uploadDocument(kbId);
      const docs = await api.listDocuments(kbId);
      const bases = await api.listKnowledgeBases();
      set({ documents: docs as Document[], bases: bases as KnowledgeBase[], uploadProgress: null });
    } finally {
      cleanup();
      set({ uploadProgress: null });
    }
  },

  setCurrentBase: (base) => set({ currentBase: base }),
}));
