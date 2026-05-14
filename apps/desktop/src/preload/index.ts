import { IpcChannel } from '@app/core';
import { contextBridge, ipcRenderer } from 'electron';

const api = {
  // Knowledge base
  listKnowledgeBases: () => ipcRenderer.invoke(IpcChannel.KB_LIST),
  createKnowledgeBase: (name: string, description: string) =>
    ipcRenderer.invoke(IpcChannel.KB_CREATE, name, description),
  deleteKnowledgeBase: (id: string) => ipcRenderer.invoke(IpcChannel.KB_DELETE, id),
  listDocuments: (kbId: string) => ipcRenderer.invoke(IpcChannel.KB_DOC_LIST, kbId),
  deleteDocument: (docId: string) => ipcRenderer.invoke(IpcChannel.KB_DOC_DELETE, docId),
  uploadDocument: (kbId: string) => ipcRenderer.invoke(IpcChannel.KB_UPLOAD, kbId),
  onUploadProgress: (cb: (progress: unknown) => void) => {
    const handler = (_: unknown, p: unknown) => cb(p);
    ipcRenderer.on(IpcChannel.KB_UPLOAD_PROGRESS, handler);
    return () => ipcRenderer.removeListener(IpcChannel.KB_UPLOAD_PROGRESS, handler);
  },
  searchKnowledgeBase: (kbId: string, query: string) =>
    ipcRenderer.invoke(IpcChannel.KB_SEARCH, kbId, query),

  // Writing
  startWriting: (req: unknown) => ipcRenderer.invoke(IpcChannel.WRITING_START, req),
  createWritingPlan: (req: unknown) => ipcRenderer.invoke(IpcChannel.WRITING_CREATE_PLAN, req),
  executeWritingPlan: (req: unknown) => ipcRenderer.invoke(IpcChannel.WRITING_EXECUTE, req),
  cancelWriting: () => ipcRenderer.invoke(IpcChannel.WRITING_CANCEL),
  onWritingPlan: (cb: (plan: unknown) => void) => {
    const handler = (_: unknown, p: unknown) => cb(p);
    ipcRenderer.on(IpcChannel.WRITING_PLAN, handler);
    return () => ipcRenderer.removeListener(IpcChannel.WRITING_PLAN, handler);
  },
  onWritingSection: (cb: (section: unknown) => void) => {
    const handler = (_: unknown, s: unknown) => cb(s);
    ipcRenderer.on(IpcChannel.WRITING_SECTION, handler);
    return () => ipcRenderer.removeListener(IpcChannel.WRITING_SECTION, handler);
  },
  onWritingProgress: (cb: (p: number) => void) => {
    const handler = (_: unknown, p: number) => cb(p);
    ipcRenderer.on(IpcChannel.WRITING_PROGRESS, handler);
    return () => ipcRenderer.removeListener(IpcChannel.WRITING_PROGRESS, handler);
  },
  onWritingDone: (cb: (full: string) => void) => {
    const handler = (_: unknown, full: string) => cb(full);
    ipcRenderer.on(IpcChannel.WRITING_DONE, handler);
    return () => ipcRenderer.removeListener(IpcChannel.WRITING_DONE, handler);
  },
  onWritingError: (cb: (error: string) => void) => {
    const handler = (_: unknown, error: string) => cb(error);
    ipcRenderer.on(IpcChannel.WRITING_ERROR, handler);
    return () => ipcRenderer.removeListener(IpcChannel.WRITING_ERROR, handler);
  },
  retrySection: (projectId: string, sectionIndex: number) =>
    ipcRenderer.invoke(IpcChannel.WRITING_RETRY_SECTION, projectId, sectionIndex),

  // Projects
  listProjects: () => ipcRenderer.invoke(IpcChannel.PROJECT_LIST),

  // Versions
  listVersions: (projectId: string) => ipcRenderer.invoke(IpcChannel.VERSION_LIST, projectId),
  getVersion: (versionId: string) => ipcRenderer.invoke(IpcChannel.VERSION_GET, versionId),
  restoreVersion: (versionId: string) => ipcRenderer.invoke(IpcChannel.VERSION_RESTORE, versionId),

  // Export
  exportMarkdown: (projectId: string) => ipcRenderer.invoke(IpcChannel.EXPORT_MD, projectId),
  exportDocx: (projectId: string) => ipcRenderer.invoke(IpcChannel.EXPORT_DOCX, projectId),

  // Settings
  getSetting: (key: string) => ipcRenderer.invoke(IpcChannel.SETTINGS_GET, key),
  setSetting: (key: string, value: string) =>
    ipcRenderer.invoke(IpcChannel.SETTINGS_SET, key, value),
  setApiKey: (config: unknown) => ipcRenderer.invoke(IpcChannel.APIKEY_SET, config),
  hasApiKey: (kind?: 'writing' | 'embedding') => ipcRenderer.invoke(IpcChannel.APIKEY_HAS, kind),
  testApiConnection: (config: unknown) => ipcRenderer.invoke(IpcChannel.APIKEY_TEST, config),
};

contextBridge.exposeInMainWorld('api', api);

export type ElectronApi = typeof api;
