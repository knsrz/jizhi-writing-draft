import {
  createModelEntry,
  type SectionOutput,
  type Style,
  type WritingPlan,
  type WritingProject,
  type WritingRevisionResult,
  type WritingType,
  type WritingVersion,
} from '@app/core';
import { create } from 'zustand';
import { inferTargetWordsFromText, sanitizeTargetWords } from '../components/writing/word-count';
import { api } from '../lib/api';
import { useSettingsStore } from './settings';
import { attachWritingListeners } from './writing-listeners';
import { getWritingStageMessage } from './writing-progress';

interface WritingState {
  topic: string;
  type: WritingType;
  style: Style;
  targetWords: number;
  knowledgeBaseId: string | null;
  status: 'idle' | 'planning' | 'reviewing' | 'writing' | 'polishing' | 'done' | 'error';
  plan: WritingPlan | null;
  sections: SectionOutput[];
  currentSectionIndex: number;
  progress: number;
  projectId: string | null;
  error: string | null;
  fullText: string;
  stageMessage: string;
  stageStartedAt: number | null;
  setForm: (
    data: Partial<
      Pick<WritingState, 'topic' | 'type' | 'style' | 'targetWords' | 'knowledgeBaseId'>
    >,
  ) => void;
  updatePlan: (plan: WritingPlan) => void;
  startWriting: () => Promise<void>;
  confirmPlan: () => Promise<void>;
  loadProject: (projectId: string) => Promise<void>;
  revise: (instruction: string) => Promise<void>;
  reset: (options?: { clearForm?: boolean }) => void;
}

let detachWritingListeners: (() => void) | null = null;
let loadProjectSequence = 0;

function clearWritingListeners(): void {
  detachWritingListeners?.();
  detachWritingListeners = null;
}

export const useWritingStore = create<WritingState>((set, get) => ({
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
  stageMessage: '',
  stageStartedAt: null,

  setForm: (data) => set(data),
  updatePlan: (plan) =>
    set({
      plan,
      targetWords: getPlanWordBudget(plan) ?? get().targetWords,
    }),

  startWriting: async () => {
    const { topic, type, style, targetWords, knowledgeBaseId } = get();
    if (!topic.trim()) return;

    const inferredTargetWords = inferTargetWordsFromText(topic, targetWords);
    loadProjectSequence += 1;
    clearWritingListeners();
    set({
      status: 'planning',
      targetWords: inferredTargetWords,
      sections: [],
      currentSectionIndex: -1,
      plan: null,
      progress: 5,
      error: null,
      fullText: '',
      stageMessage: '正在生成写作规划',
      stageStartedAt: Date.now(),
    });

    try {
      const modelConfigId = getSelectedWritingModelConfigId();
      const plan = (await api.createWritingPlan({
        topic,
        type,
        style,
        targetWords: inferredTargetWords,
        knowledgeBaseId,
        modelConfigId,
      })) as WritingPlan;

      set({
        status: 'reviewing',
        plan,
        targetWords: inferredTargetWords,
        progress: 10,
        stageMessage: '规划已生成，等待确认',
        stageStartedAt: Date.now(),
      });
    } catch (e) {
      set({ status: 'error', error: e instanceof Error ? e.message : String(e) });
    }
  },

  confirmPlan: async () => {
    const { topic, type, style, targetWords, knowledgeBaseId, plan } = get();
    if (!topic.trim() || !plan) return;
    const effectiveTargetWords = getPlanWordBudget(plan) ?? targetWords;

    clearWritingListeners();
    set({
      status: 'writing',
      targetWords: effectiveTargetWords,
      sections: [],
      currentSectionIndex: -1,
      progress: 10,
      error: null,
      fullText: '',
      stageMessage: '正在撰写正文',
      stageStartedAt: Date.now(),
    });

    detachWritingListeners = attachWritingListeners(api, {
      onPlan: (plan) => set({ plan: plan as WritingPlan, status: 'writing' }),
      onSection: (section) => {
        const s = section as SectionOutput;
        set((state) => {
          const sections = [...state.sections];
          const existing = sections.findIndex((x) => x.sectionIndex === s.sectionIndex);
          if (existing >= 0) sections[existing] = s;
          else sections.push(s);
          return { sections, currentSectionIndex: s.sectionIndex };
        });
      },
      onProgress: (p) => {
        const progress = p as { percent?: number };
        const stageMessage = getWritingStageMessage(progress);
        set((state) => ({
          progress: typeof progress.percent === 'number' ? progress.percent : state.progress,
          stageMessage: stageMessage ?? state.stageMessage,
          stageStartedAt:
            stageMessage && stageMessage !== state.stageMessage ? Date.now() : state.stageStartedAt,
        }));
      },
      onDone: (result) => {
        const r = result as { projectId: string; content: string; wordCount: number };
        set((state) => ({
          status: 'done',
          projectId: r.projectId,
          fullText: r.content,
          sections: sectionsFromMarkdown(r.content),
          currentSectionIndex: state.plan?.sections.length ?? state.sections.length,
          progress: 100,
          stageMessage: '已完成',
          stageStartedAt: Date.now(),
        }));
        clearWritingListeners();
      },
      onError: (error) => {
        set({ status: 'error', error });
        clearWritingListeners();
      },
    });

    try {
      const modelConfigId = getSelectedWritingModelConfigId();

      await api.executeWritingPlan({
        topic,
        type,
        style,
        targetWords: effectiveTargetWords,
        knowledgeBaseId,
        modelConfigId,
        plan,
      });
    } catch (e) {
      set({ status: 'error', error: e instanceof Error ? e.message : String(e) });
      clearWritingListeners();
    }
  },

  loadProject: async (projectId) => {
    clearWritingListeners();
    loadProjectSequence += 1;
    const requestId = loadProjectSequence;
    set({
      status: 'planning',
      projectId,
      error: null,
      progress: 5,
      fullText: '',
      stageMessage: '正在打开历史项目',
      stageStartedAt: Date.now(),
    });

    try {
      const [project, version] = (await Promise.all([
        api.getProject(projectId),
        api.getLatestProjectVersion(projectId),
      ])) as [WritingProject | null, WritingVersion | null];

      if (!project) throw new Error('未找到写作项目');
      const plan = normalizePlan(project.plan);
      const fullText = version?.content ?? '';
      const isDone = project.status === 'done' && Boolean(version);
      if (requestId !== loadProjectSequence) return;

      set({
        topic: project.title,
        type: project.writingType,
        style: project.style,
        targetWords: project.targetWords,
        knowledgeBaseId: project.knowledgeBaseId,
        status: isDone ? 'done' : project.status === 'draft' ? 'idle' : project.status,
        plan,
        sections: fullText ? sectionsFromMarkdown(fullText) : [],
        currentSectionIndex: plan?.sections.length ?? -1,
        progress: isDone ? 100 : 0,
        projectId: project.id,
        error: null,
        fullText,
        stageMessage: isDone ? '已完成' : '',
        stageStartedAt: null,
      });
    } catch (e) {
      if (requestId !== loadProjectSequence) return;
      set({
        status: 'error',
        error: e instanceof Error ? e.message : String(e),
        progress: 0,
      });
    }
  },

  revise: async (instruction) => {
    const cleanInstruction = instruction.trim();
    const { projectId } = get();
    if (!projectId || !cleanInstruction) return;

    set({
      status: 'polishing',
      progress: 95,
      error: null,
      stageMessage: '正在按要求修改成稿',
      stageStartedAt: Date.now(),
    });

    try {
      const modelConfigId = getSelectedWritingModelConfigId();
      const result = (await api.reviseWriting({
        projectId,
        instruction: cleanInstruction,
        modelConfigId,
      })) as WritingRevisionResult;

      set((state) => ({
        status: 'done',
        projectId: result.projectId,
        fullText: result.content,
        sections: sectionsFromMarkdown(result.content),
        currentSectionIndex: state.plan?.sections.length ?? state.sections.length,
        progress: 100,
        error: null,
        stageMessage: '已完成',
        stageStartedAt: Date.now(),
      }));
    } catch (e) {
      set({
        status: 'error',
        error: e instanceof Error ? e.message : String(e),
      });
    }
  },

  reset: (options) => {
    clearWritingListeners();
    loadProjectSequence += 1;
    void api.cancelWriting().catch(() => undefined);
    set({
      ...(options?.clearForm
        ? {
            topic: '',
            type: 'summary' as const,
            style: 'formal' as const,
            targetWords: 2000,
            knowledgeBaseId: null,
          }
        : {}),
      status: 'idle',
      plan: null,
      sections: [],
      currentSectionIndex: -1,
      progress: 0,
      projectId: null,
      error: null,
      fullText: '',
      stageMessage: '',
      stageStartedAt: null,
    });
  },
}));

function getSelectedWritingModelConfigId(): string | undefined {
  const { writing } = useSettingsStore.getState();
  return writing.baseUrl.trim() && writing.model.trim()
    ? createModelEntry('writing', writing).id
    : undefined;
}

function normalizePlan(plan: WritingProject['plan'] | string): WritingPlan | null {
  if (!plan) return null;
  if (typeof plan === 'string') {
    try {
      return JSON.parse(plan) as WritingPlan;
    } catch {
      return null;
    }
  }
  return plan;
}

function sectionsFromMarkdown(content: string): SectionOutput[] {
  const lines = content.split(/\r?\n/);
  const sections: SectionOutput[] = [];
  let currentTitle = '正文';
  let currentLines: string[] = [];

  const pushCurrent = () => {
    const sectionContent = currentLines.join('\n').trim();
    if (!sectionContent && sections.length === 0 && currentTitle === '正文') return;
    sections.push({
      sectionIndex: sections.length,
      title: currentTitle,
      content: sectionContent,
    });
  };

  for (const line of lines) {
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      pushCurrent();
      currentTitle = heading[1];
      currentLines = [];
      continue;
    }
    currentLines.push(line);
  }

  pushCurrent();

  if (sections.length > 0) return sections;
  return [{ sectionIndex: 0, title: '正文', content }];
}

function getPlanWordBudget(plan: WritingPlan): number | null {
  const total =
    plan.totalWordBudget || plan.sections.reduce((sum, section) => sum + section.targetWords, 0);
  return total > 0 ? sanitizeTargetWords(total) : null;
}
