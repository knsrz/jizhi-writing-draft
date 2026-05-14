import {
  createModelEntry,
  type SectionOutput,
  type Style,
  type WritingPlan,
  type WritingType,
} from '@app/core';
import { create } from 'zustand';
import { api } from '../lib/api';
import { useSettingsStore } from './settings';
import { attachWritingListeners } from './writing-listeners';

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
  setForm: (
    data: Partial<
      Pick<WritingState, 'topic' | 'type' | 'style' | 'targetWords' | 'knowledgeBaseId'>
    >,
  ) => void;
  updatePlan: (plan: WritingPlan) => void;
  startWriting: () => Promise<void>;
  confirmPlan: () => Promise<void>;
  reset: () => void;
}

let detachWritingListeners: (() => void) | null = null;

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

  setForm: (data) => set(data),
  updatePlan: (plan) => set({ plan }),

  startWriting: async () => {
    const { topic, type, style, targetWords, knowledgeBaseId } = get();
    if (!topic.trim()) return;

    clearWritingListeners();
    set({
      status: 'planning',
      sections: [],
      currentSectionIndex: -1,
      plan: null,
      progress: 5,
      error: null,
      fullText: '',
    });

    try {
      const modelConfigId = getSelectedWritingModelConfigId();
      const plan = (await api.createWritingPlan({
        topic,
        type,
        style,
        targetWords,
        knowledgeBaseId,
        modelConfigId,
      })) as WritingPlan;

      set({ status: 'reviewing', plan, progress: 10 });
    } catch (e) {
      set({ status: 'error', error: e instanceof Error ? e.message : String(e) });
    }
  },

  confirmPlan: async () => {
    const { topic, type, style, targetWords, knowledgeBaseId, plan } = get();
    if (!topic.trim() || !plan) return;

    clearWritingListeners();
    set({
      status: 'writing',
      sections: [],
      currentSectionIndex: -1,
      progress: 10,
      error: null,
      fullText: '',
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
        if (typeof progress.percent === 'number') set({ progress: progress.percent });
      },
      onDone: (result) => {
        const r = result as { projectId: string; content: string; wordCount: number };
        set({ status: 'done', projectId: r.projectId, fullText: r.content, progress: 100 });
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
        targetWords,
        knowledgeBaseId,
        modelConfigId,
        plan,
      });
    } catch (e) {
      set({ status: 'error', error: e instanceof Error ? e.message : String(e) });
      clearWritingListeners();
    }
  },

  reset: () => {
    clearWritingListeners();
    void api.cancelWriting().catch(() => undefined);
    set({
      status: 'idle',
      plan: null,
      sections: [],
      currentSectionIndex: -1,
      progress: 0,
      projectId: null,
      error: null,
      fullText: '',
    });
  },
}));

function getSelectedWritingModelConfigId(): string | undefined {
  const { writing } = useSettingsStore.getState();
  return writing.baseUrl.trim() && writing.model.trim()
    ? createModelEntry('writing', writing).id
    : undefined;
}
