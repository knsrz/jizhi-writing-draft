import type { ElectronApi } from '../../preload/index';

const w = window as unknown as { api: ElectronApi };

export const api = {
  listKnowledgeBases: () => w.api.listKnowledgeBases(),
  createKnowledgeBase: (name: string, description: string) =>
    w.api.createKnowledgeBase(name, description),
  deleteKnowledgeBase: (id: string) => w.api.deleteKnowledgeBase(id),
  listDocuments: (kbId: string) => w.api.listDocuments(kbId),
  deleteDocument: (docId: string) => w.api.deleteDocument(docId),
  uploadDocument: (kbId: string) => w.api.uploadDocument(kbId),
  onUploadProgress: (cb: (p: unknown) => void) => w.api.onUploadProgress(cb),
  searchKnowledgeBase: (kbId: string, query: string) => w.api.searchKnowledgeBase(kbId, query),

  startWriting: (req: unknown) => w.api.startWriting(req),
  createWritingPlan: (req: unknown) => w.api.createWritingPlan(req),
  executeWritingPlan: (req: unknown) => w.api.executeWritingPlan(req),
  reviseWriting: (req: unknown) => w.api.reviseWriting(req),
  cancelWriting: () => w.api.cancelWriting(),
  onWritingPlan: (cb: (plan: unknown) => void) => w.api.onWritingPlan(cb),
  onWritingSection: (cb: (section: unknown) => void) => w.api.onWritingSection(cb),
  onWritingProgress: (cb: (p: unknown) => void) => w.api.onWritingProgress(cb),
  onWritingDone: (cb: (result: unknown) => void) => w.api.onWritingDone(cb),
  onWritingError: (cb: (error: string) => void) => w.api.onWritingError(cb),
  retrySection: (projectId: string, sectionIndex: number) =>
    w.api.retrySection(projectId, sectionIndex),

  listProjects: () => w.api.listProjects(),
  getProject: (projectId: string) => w.api.getProject(projectId),

  listVersions: (projectId: string) => w.api.listVersions(projectId),
  getLatestProjectVersion: (projectId: string) => w.api.getLatestProjectVersion(projectId),
  getVersion: (versionId: string) => w.api.getVersion(versionId),
  restoreVersion: (versionId: string) => w.api.restoreVersion(versionId),

  exportMarkdown: (projectId: string) => w.api.exportMarkdown(projectId),
  exportDocx: (projectId: string) => w.api.exportDocx(projectId),

  getSetting: (key: string) => w.api.getSetting(key),
  setSetting: (key: string, value: string) => w.api.setSetting(key, value),
  setApiKey: (config: unknown) => w.api.setApiKey(config),
  hasApiKey: (kind?: 'writing' | 'embedding') => w.api.hasApiKey(kind),
  testApiConnection: (config: unknown) => w.api.testApiConnection(config),
};
