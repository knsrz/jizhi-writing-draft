import type { WritingPlan, WritingProject, WritingVersion } from '@app/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiMocks = vi.hoisted(() => ({
  cancelWriting: vi.fn(),
  createWritingPlan: vi.fn(),
  executeWritingPlan: vi.fn(),
  getLatestProjectVersion: vi.fn(),
  getProject: vi.fn(),
  reviseWriting: vi.fn(),
}));

vi.mock('../lib/api', () => ({ api: apiMocks }));

vi.mock('./settings', () => ({
  useSettingsStore: {
    getState: () => ({
      writing: {
        baseUrl: 'https://api.example.test',
        model: 'writer-model',
        provider: 'custom',
        apiKey: '',
        models: [],
      },
    }),
  },
}));

const plan: WritingPlan = {
  goal: '形成可导出的总结',
  audience: '管理层',
  sections: [
    {
      title: '关键成果',
      targetWords: 500,
      keywords: ['成果'],
      needsRAG: false,
    },
  ],
  totalWordBudget: 500,
  missingInfo: [],
};

const project: WritingProject = {
  id: 'project-1',
  title: '季度总结',
  writingType: 'summary',
  targetWords: 1200,
  style: 'formal',
  knowledgeBaseId: null,
  status: 'done',
  plan,
  createdAt: '2026-05-14T00:00:00.000Z',
  updatedAt: '2026-05-14T00:10:00.000Z',
};

const version: WritingVersion = {
  id: 'version-1',
  projectId: 'project-1',
  versionNumber: 1,
  content: '## 关键成果\n\n最终成稿',
  wordCount: 42,
  changeSummary: '初稿',
  createdAt: '2026-05-14T00:10:00.000Z',
};

describe('useWritingStore history and revision flow', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    apiMocks.cancelWriting.mockResolvedValue({ cancelled: true });
    const { useWritingStore } = await import('./writing');
    useWritingStore.setState({
      topic: '',
      type: 'summary',
      style: 'formal',
      targetWords: 2000,
      knowledgeBaseId: null,
      status: 'idle',
      plan: null,
      sections: [],
      currentSectionIndex: -1,
      progress: 0,
      projectId: null,
      error: null,
      fullText: '',
    });
  });

  it('loads a completed history project into the export-ready workbench', async () => {
    apiMocks.getProject.mockResolvedValue(project);
    apiMocks.getLatestProjectVersion.mockResolvedValue(version);
    const { useWritingStore } = await import('./writing');

    await useWritingStore.getState().loadProject('project-1');

    expect(apiMocks.getProject).toHaveBeenCalledWith('project-1');
    expect(apiMocks.getLatestProjectVersion).toHaveBeenCalledWith('project-1');
    expect(useWritingStore.getState()).toMatchObject({
      status: 'done',
      projectId: 'project-1',
      topic: '季度总结',
      fullText: '## 关键成果\n\n最终成稿',
      progress: 100,
    });
    expect(useWritingStore.getState().plan).toEqual(plan);
  });

  it('keeps the completed project open after asking the agent to revise it', async () => {
    apiMocks.reviseWriting.mockResolvedValue({
      projectId: 'project-1',
      content: '## 关键成果\n\n按要求修改后的成稿',
      wordCount: 48,
    });
    const { useWritingStore } = await import('./writing');
    useWritingStore.setState({
      ...useWritingStore.getState(),
      status: 'done',
      projectId: 'project-1',
      fullText: '## 关键成果\n\n最终成稿',
    });

    await useWritingStore.getState().revise('语气更正式');

    expect(apiMocks.reviseWriting).toHaveBeenCalledWith({
      projectId: 'project-1',
      instruction: '语气更正式',
      modelConfigId: expect.any(String),
    });
    expect(useWritingStore.getState()).toMatchObject({
      status: 'done',
      projectId: 'project-1',
      fullText: '## 关键成果\n\n按要求修改后的成稿',
      progress: 100,
      error: null,
    });
  });

  it('uses an explicit word limit from the prompt when creating a plan', async () => {
    apiMocks.createWritingPlan.mockResolvedValue(plan);
    const { useWritingStore } = await import('./writing');
    useWritingStore.setState({
      ...useWritingStore.getState(),
      topic: '请写一份 200 字以内的发布通知',
      targetWords: 2000,
    });

    await useWritingStore.getState().startWriting();

    expect(apiMocks.createWritingPlan).toHaveBeenCalledWith(
      expect.objectContaining({ targetWords: 200 }),
    );
    expect(useWritingStore.getState()).toMatchObject({
      status: 'reviewing',
      targetWords: 200,
    });
  });

  it('keeps targetWords synchronized when the confirmed plan budget changes', async () => {
    const { useWritingStore } = await import('./writing');
    const compactPlan: WritingPlan = {
      ...plan,
      sections: [{ ...plan.sections[0], targetWords: 400 }],
      totalWordBudget: 400,
    };
    useWritingStore.setState({
      ...useWritingStore.getState(),
      targetWords: 2000,
    });

    useWritingStore.getState().updatePlan(compactPlan);

    expect(useWritingStore.getState()).toMatchObject({
      plan: compactPlan,
      targetWords: 400,
    });
  });

  it('ignores a stale history load after the user starts a new writing task', async () => {
    const pendingProject = deferred<WritingProject | null>();
    const pendingVersion = deferred<WritingVersion | null>();
    apiMocks.getProject.mockReturnValue(pendingProject.promise);
    apiMocks.getLatestProjectVersion.mockReturnValue(pendingVersion.promise);
    const { useWritingStore } = await import('./writing');

    const load = useWritingStore.getState().loadProject('project-1');
    useWritingStore.getState().reset();
    pendingProject.resolve(project);
    pendingVersion.resolve(version);
    await load;

    expect(useWritingStore.getState()).toMatchObject({
      status: 'idle',
      projectId: null,
      fullText: '',
    });
  });

  it('can clear the writing form when starting a brand new draft', async () => {
    const { useWritingStore } = await import('./writing');
    useWritingStore.setState({
      ...useWritingStore.getState(),
      topic: '旧写作需求',
      targetWords: 200,
      knowledgeBaseId: 'kb-1',
      status: 'done',
      projectId: 'project-1',
      fullText: '旧成稿',
    });

    useWritingStore.getState().reset({ clearForm: true });

    expect(useWritingStore.getState()).toMatchObject({
      topic: '',
      type: 'summary',
      style: 'formal',
      targetWords: 2000,
      knowledgeBaseId: null,
      status: 'idle',
      projectId: null,
      fullText: '',
    });
  });

  it('keeps the form when returning from plan review to the draft form', async () => {
    const { useWritingStore } = await import('./writing');
    useWritingStore.setState({
      ...useWritingStore.getState(),
      topic: '继续编辑这个需求',
      targetWords: 200,
      status: 'reviewing',
      plan,
    });

    useWritingStore.getState().reset();

    expect(useWritingStore.getState()).toMatchObject({
      topic: '继续编辑这个需求',
      targetWords: 200,
      status: 'idle',
      plan: null,
    });
  });
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
