import { create } from 'zustand';
import { api } from '../lib/api';

type SettingsKind = 'writing' | 'embedding';

interface EndpointState {
  provider: string;
  baseUrl: string;
  model: string;
  apiKeySet: boolean;
}

interface ConnectionTestResult {
  success: boolean;
  latencyMs: number;
  error?: string;
}

interface SettingsState {
  writing: EndpointState;
  embedding: EndpointState;
  saving: SettingsKind | null;
  testing: SettingsKind | null;
  testResult: Record<SettingsKind, ConnectionTestResult | null>;
  setWritingConfig: (config: Partial<Omit<EndpointState, 'apiKeySet'>>) => void;
  setEmbeddingConfig: (config: Partial<Omit<EndpointState, 'apiKeySet'>>) => void;
  saveWritingApiKey: (apiKey?: string) => Promise<void>;
  saveEmbeddingApiKey: (apiKey?: string) => Promise<void>;
  testWritingConnection: (apiKey?: string) => Promise<void>;
  testEmbeddingConnection: (apiKey?: string) => Promise<void>;
  loadSettings: () => Promise<void>;
}

const defaultWriting: EndpointState = {
  provider: 'openai',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o',
  apiKeySet: false,
};

const defaultEmbedding: EndpointState = {
  provider: 'openai',
  baseUrl: 'https://api.openai.com/v1',
  model: 'text-embedding-3-small',
  apiKeySet: false,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  writing: defaultWriting,
  embedding: defaultEmbedding,
  saving: null,
  testing: null,
  testResult: { writing: null, embedding: null },

  setWritingConfig: (config) => set((state) => ({ writing: { ...state.writing, ...config } })),

  setEmbeddingConfig: (config) =>
    set((state) => ({ embedding: { ...state.embedding, ...config } })),

  saveWritingApiKey: async (apiKey?: string) => {
    const { writing } = get();
    set((state) => ({ saving: 'writing', testResult: { ...state.testResult, writing: null } }));
    try {
      await Promise.all([
        api.setSetting('provider', writing.provider),
        api.setSetting('base_url', writing.baseUrl),
        api.setSetting('writing_model', writing.model),
      ]);
      if (apiKey?.trim()) {
        await api.setApiKey({
          kind: 'writing',
          provider: writing.provider,
          baseUrl: writing.baseUrl,
          apiKey: apiKey.trim(),
          model: writing.model,
        });
        set((state) => ({ writing: { ...state.writing, apiKeySet: true } }));
      }
    } finally {
      set({ saving: null });
    }
  },

  saveEmbeddingApiKey: async (apiKey?: string) => {
    const { embedding } = get();
    set((state) => ({
      saving: 'embedding',
      testResult: { ...state.testResult, embedding: null },
    }));
    try {
      await Promise.all([
        api.setSetting('embedding_provider', embedding.provider),
        api.setSetting('embedding_base_url', embedding.baseUrl),
        api.setSetting('embedding_model', embedding.model),
      ]);
      if (apiKey?.trim()) {
        await api.setApiKey({
          kind: 'embedding',
          provider: embedding.provider,
          baseUrl: embedding.baseUrl,
          apiKey: apiKey.trim(),
          model: embedding.model,
        });
        set((state) => ({ embedding: { ...state.embedding, apiKeySet: true } }));
      }
    } finally {
      set({ saving: null });
    }
  },

  testWritingConnection: async (apiKey?: string) => {
    const { writing } = get();
    set((state) => ({ testing: 'writing', testResult: { ...state.testResult, writing: null } }));
    const result = await api.testApiConnection({
      kind: 'writing',
      baseUrl: writing.baseUrl,
      apiKey: apiKey?.trim() || '',
      model: writing.model,
    });
    set((state) => ({
      testing: null,
      testResult: { ...state.testResult, writing: result as ConnectionTestResult },
    }));
  },

  testEmbeddingConnection: async (apiKey?: string) => {
    const { embedding } = get();
    set((state) => ({
      testing: 'embedding',
      testResult: { ...state.testResult, embedding: null },
    }));
    const result = await api.testApiConnection({
      kind: 'embedding',
      baseUrl: embedding.baseUrl,
      apiKey: apiKey?.trim() || '',
      model: embedding.model,
    });
    set((state) => ({
      testing: null,
      testResult: { ...state.testResult, embedding: result as ConnectionTestResult },
    }));
  },

  loadSettings: async () => {
    const [
      provider,
      baseUrl,
      writingModel,
      embeddingProvider,
      embeddingBaseUrl,
      embeddingModel,
      hasWritingApiKey,
      hasEmbeddingApiKey,
    ] = await Promise.all([
      api.getSetting('provider').catch(() => null),
      api.getSetting('base_url').catch(() => null),
      api.getSetting('writing_model').catch(() => null),
      api.getSetting('embedding_provider').catch(() => null),
      api.getSetting('embedding_base_url').catch(() => null),
      api.getSetting('embedding_model').catch(() => null),
      api.hasApiKey('writing').catch(() => false),
      api.hasApiKey('embedding').catch(() => false),
    ]);

    const writing = {
      provider: String(provider || defaultWriting.provider),
      baseUrl: String(baseUrl || defaultWriting.baseUrl),
      model: String(writingModel || defaultWriting.model),
      apiKeySet: Boolean(hasWritingApiKey),
    };

    set({
      writing,
      embedding: {
        provider: String(embeddingProvider || provider || defaultEmbedding.provider),
        baseUrl: String(embeddingBaseUrl || baseUrl || defaultEmbedding.baseUrl),
        model: String(embeddingModel || defaultEmbedding.model),
        apiKeySet: Boolean(hasEmbeddingApiKey),
      },
    });
  },
}));
