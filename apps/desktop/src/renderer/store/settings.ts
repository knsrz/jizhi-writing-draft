import type { ModelConfigKind, SavedModelEntry } from '@app/core';
import {
  createModelEntry,
  MODEL_LIST_SETTING_KEYS,
  parseModelEntries,
  serializeModelEntries,
  upsertModelEntry,
} from '@app/core';
import { create } from 'zustand';
import { api } from '../lib/api';

type SettingsKind = ModelConfigKind;

interface EndpointState {
  provider: string;
  baseUrl: string;
  model: string;
  models: SavedModelEntry[];
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
  selectWritingModel: (modelConfigId: string) => Promise<void>;
  selectEmbeddingModel: (modelConfigId: string) => Promise<void>;
  testWritingConnection: (apiKey?: string) => Promise<void>;
  testEmbeddingConnection: (apiKey?: string) => Promise<void>;
  loadSettings: () => Promise<void>;
}

const defaultWriting: EndpointState = {
  provider: 'openai',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-5.1',
  models: [],
  apiKeySet: false,
};

const defaultEmbedding: EndpointState = {
  provider: 'openai',
  baseUrl: 'https://api.openai.com/v1',
  model: 'text-embedding-3-small',
  models: [],
  apiKeySet: false,
};

const endpointSettingKeys = {
  writing: {
    provider: 'provider',
    baseUrl: 'base_url',
    model: 'writing_model',
  },
  embedding: {
    provider: 'embedding_provider',
    baseUrl: 'embedding_base_url',
    model: 'embedding_model',
  },
} as const;

function ensureCurrentModel(
  kind: SettingsKind,
  endpoint: Omit<EndpointState, 'models' | 'apiKeySet'>,
  models: SavedModelEntry[],
): SavedModelEntry[] {
  if (!endpoint.baseUrl.trim() || !endpoint.model.trim()) return models;
  return upsertModelEntry(models, { kind, ...endpoint });
}

function getModelConfigId(kind: SettingsKind, endpoint: EndpointState): string {
  return createModelEntry(kind, endpoint).id;
}

async function persistSelectedEndpoint(kind: SettingsKind, entry: SavedModelEntry): Promise<void> {
  const keys = endpointSettingKeys[kind];
  await Promise.all([
    api.setSetting(keys.provider, entry.provider),
    api.setSetting(keys.baseUrl, entry.baseUrl),
    api.setSetting(keys.model, entry.model),
  ]);
}

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
      const modelEntry = createModelEntry('writing', writing);
      const models = upsertModelEntry(writing.models, { kind: 'writing', ...writing });
      await Promise.all([
        api.setSetting('provider', writing.provider),
        api.setSetting('base_url', writing.baseUrl),
        api.setSetting('writing_model', writing.model),
        api.setSetting(MODEL_LIST_SETTING_KEYS.writing, serializeModelEntries(models)),
      ]);
      if (apiKey?.trim()) {
        await api.setApiKey({
          kind: 'writing',
          provider: writing.provider,
          baseUrl: writing.baseUrl,
          apiKey: apiKey.trim(),
          model: writing.model,
          modelConfigId: modelEntry.id,
        });
      }
      set((state) => ({
        writing: {
          ...state.writing,
          models,
          apiKeySet: state.writing.apiKeySet || Boolean(apiKey?.trim()),
        },
      }));
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
      const modelEntry = createModelEntry('embedding', embedding);
      const models = upsertModelEntry(embedding.models, { kind: 'embedding', ...embedding });
      await Promise.all([
        api.setSetting('embedding_provider', embedding.provider),
        api.setSetting('embedding_base_url', embedding.baseUrl),
        api.setSetting('embedding_model', embedding.model),
        api.setSetting(MODEL_LIST_SETTING_KEYS.embedding, serializeModelEntries(models)),
      ]);
      if (apiKey?.trim()) {
        await api.setApiKey({
          kind: 'embedding',
          provider: embedding.provider,
          baseUrl: embedding.baseUrl,
          apiKey: apiKey.trim(),
          model: embedding.model,
          modelConfigId: modelEntry.id,
        });
      }
      set((state) => ({
        embedding: {
          ...state.embedding,
          models,
          apiKeySet: state.embedding.apiKeySet || Boolean(apiKey?.trim()),
        },
      }));
    } finally {
      set({ saving: null });
    }
  },

  selectWritingModel: async (modelConfigId: string) => {
    const entry = get().writing.models.find((model) => model.id === modelConfigId);
    if (!entry) return;

    set((state) => ({
      writing: {
        ...state.writing,
        provider: entry.provider,
        baseUrl: entry.baseUrl,
        model: entry.model,
      },
    }));
    await persistSelectedEndpoint('writing', entry);
  },

  selectEmbeddingModel: async (modelConfigId: string) => {
    const entry = get().embedding.models.find((model) => model.id === modelConfigId);
    if (!entry) return;

    set((state) => ({
      embedding: {
        ...state.embedding,
        provider: entry.provider,
        baseUrl: entry.baseUrl,
        model: entry.model,
      },
    }));
    await persistSelectedEndpoint('embedding', entry);
  },

  testWritingConnection: async (apiKey?: string) => {
    const { writing } = get();
    set((state) => ({ testing: 'writing', testResult: { ...state.testResult, writing: null } }));
    const result = await api.testApiConnection({
      kind: 'writing',
      baseUrl: writing.baseUrl,
      apiKey: apiKey?.trim() || '',
      model: writing.model,
      modelConfigId: getModelConfigId('writing', writing),
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
      modelConfigId: getModelConfigId('embedding', embedding),
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
      writingModelsRaw,
      embeddingModelsRaw,
      hasWritingApiKey,
      hasEmbeddingApiKey,
    ] = await Promise.all([
      api.getSetting('provider').catch(() => null),
      api.getSetting('base_url').catch(() => null),
      api.getSetting('writing_model').catch(() => null),
      api.getSetting('embedding_provider').catch(() => null),
      api.getSetting('embedding_base_url').catch(() => null),
      api.getSetting('embedding_model').catch(() => null),
      api.getSetting(MODEL_LIST_SETTING_KEYS.writing).catch(() => null),
      api.getSetting(MODEL_LIST_SETTING_KEYS.embedding).catch(() => null),
      api.hasApiKey('writing').catch(() => false),
      api.hasApiKey('embedding').catch(() => false),
    ]);

    const writingModels = parseModelEntries(writingModelsRaw, 'writing');
    const embeddingModels = parseModelEntries(embeddingModelsRaw, 'embedding');

    const writing = {
      provider: String(provider || defaultWriting.provider),
      baseUrl: String(baseUrl || defaultWriting.baseUrl),
      model: String(writingModel || defaultWriting.model),
      models: [],
      apiKeySet: Boolean(hasWritingApiKey),
    };

    const embeddingEndpoint = {
      provider: String(embeddingProvider || provider || defaultEmbedding.provider),
      baseUrl: String(embeddingBaseUrl || baseUrl || defaultEmbedding.baseUrl),
      model: String(embeddingModel || defaultEmbedding.model),
      models: [],
      apiKeySet: Boolean(hasEmbeddingApiKey),
    };

    set({
      writing: {
        ...writing,
        models:
          writingModels.length > 0 || hasWritingApiKey
            ? ensureCurrentModel('writing', writing, writingModels)
            : writingModels,
      },
      embedding: {
        ...embeddingEndpoint,
        models:
          embeddingModels.length > 0 || hasEmbeddingApiKey
            ? ensureCurrentModel('embedding', embeddingEndpoint, embeddingModels)
            : embeddingModels,
      },
    });
  },
}));
