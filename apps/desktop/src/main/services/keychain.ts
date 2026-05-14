import type { ModelConfigKind } from '@app/core';
import {
  createModelEntry,
  MODEL_LIST_SETTING_KEYS,
  parseModelEntries,
  serializeModelEntries,
  upsertModelEntry,
} from '@app/core';
import { eq } from 'drizzle-orm';
import { safeStorage } from 'electron';
import { getDb } from '../db/index.js';
import { settings } from '../db/schema.js';

const API_KEY_PREFIX = 'apikey_encrypted_';

interface StoredEndpointConfig {
  provider: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

function isEncryptionAvailable(): boolean {
  return safeStorage.isEncryptionAvailable();
}

export const keychain = {
  async storeApiKey(modelConfig: {
    kind?: ModelConfigKind;
    provider: string;
    baseUrl: string;
    apiKey: string;
    model?: string;
    writingModel?: string;
    embeddingModel?: string;
    modelConfigId?: string;
  }): Promise<void> {
    const db = getDb();
    const kind = modelConfig.kind ?? 'writing';
    const encryptedKey = `${API_KEY_PREFIX}${kind}`;
    const modelKey = kind === 'writing' ? 'writing_model' : 'embedding_model';
    const providerKey = kind === 'writing' ? 'provider' : 'embedding_provider';
    const baseUrlKey = kind === 'writing' ? 'base_url' : 'embedding_base_url';
    const modelValue =
      modelConfig.model ??
      (kind === 'writing' ? modelConfig.writingModel : modelConfig.embeddingModel) ??
      '';
    const modelEntry = createModelEntry(kind, {
      provider: modelConfig.provider,
      baseUrl: modelConfig.baseUrl,
      model: modelValue,
    });
    const modelConfigId = modelConfig.modelConfigId || modelEntry.id;

    if (isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(modelConfig.apiKey);
      const encoded = encrypted.toString('base64');

      await Promise.all(
        [encryptedKey, `${encryptedKey}:${modelConfigId}`].map((key) =>
          db
            .insert(settings)
            .values({
              key,
              value: encoded,
            })
            .onConflictDoUpdate({ target: settings.key, set: { value: encoded } }),
        ),
      );
    }

    await db
      .insert(settings)
      .values({ key: providerKey, value: modelConfig.provider })
      .onConflictDoUpdate({ target: settings.key, set: { value: modelConfig.provider } });
    await db
      .insert(settings)
      .values({ key: baseUrlKey, value: modelConfig.baseUrl })
      .onConflictDoUpdate({ target: settings.key, set: { value: modelConfig.baseUrl } });
    await db
      .insert(settings)
      .values({ key: modelKey, value: modelValue })
      .onConflictDoUpdate({ target: settings.key, set: { value: modelValue } });

    const existingModels = parseModelEntries(
      (
        await db
          .select()
          .from(settings)
          .where(eq(settings.key, MODEL_LIST_SETTING_KEYS[kind]))
          .get()
      )?.value,
      kind,
    );
    const models = upsertModelEntry(existingModels, {
      kind,
      provider: modelConfig.provider,
      baseUrl: modelConfig.baseUrl,
      model: modelValue,
    });

    await db
      .insert(settings)
      .values({ key: MODEL_LIST_SETTING_KEYS[kind], value: serializeModelEntries(models) })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: serializeModelEntries(models) },
      });
  },

  async getApiKey(): Promise<{
    provider: string;
    baseUrl: string;
    apiKey: string;
    writingModel: string;
    embeddingModel: string;
  } | null> {
    const db = getDb();
    const rows = await db.select().from(settings);
    const map = new Map(rows.map((r) => [r.key, r.value]));

    const provider = map.get('provider');
    const baseUrl = map.get('base_url');
    const writingModel = map.get('writing_model');
    const embeddingModel = map.get('embedding_model');

    if (!provider || !baseUrl) return null;

    const apiKey = decryptApiKey(map, 'writing');

    return {
      provider,
      baseUrl,
      apiKey,
      writingModel: writingModel || 'gpt-4o',
      embeddingModel: embeddingModel || 'text-embedding-3-small',
    };
  },

  async getWritingApiConfig(modelConfigId?: string | null): Promise<StoredEndpointConfig | null> {
    const db = getDb();
    const rows = await db.select().from(settings);
    const map = new Map(rows.map((r) => [r.key, r.value]));

    if (modelConfigId) {
      const model = parseModelEntries(map.get(MODEL_LIST_SETTING_KEYS.writing), 'writing').find(
        (entry) => entry.id === modelConfigId,
      );
      if (model) {
        return {
          provider: model.provider,
          baseUrl: model.baseUrl,
          apiKey: decryptApiKey(map, 'writing', model.id),
          model: model.model,
        };
      }
    }

    const provider = map.get('provider');
    const baseUrl = map.get('base_url');

    if (!provider || !baseUrl) return null;

    return {
      provider,
      baseUrl,
      apiKey: decryptApiKey(map, 'writing'),
      model: map.get('writing_model') || 'gpt-4o',
    };
  },

  async getEmbeddingApiConfig(modelConfigId?: string | null): Promise<StoredEndpointConfig | null> {
    const db = getDb();
    const rows = await db.select().from(settings);
    const map = new Map(rows.map((r) => [r.key, r.value]));

    if (modelConfigId) {
      const model = parseModelEntries(map.get(MODEL_LIST_SETTING_KEYS.embedding), 'embedding').find(
        (entry) => entry.id === modelConfigId,
      );
      if (model) {
        return {
          provider: model.provider,
          baseUrl: model.baseUrl,
          apiKey:
            decryptApiKey(map, 'embedding', model.id) ||
            decryptApiKey(map, 'writing', model.id) ||
            decryptApiKey(map, 'embedding') ||
            decryptApiKey(map, 'writing'),
          model: model.model,
        };
      }
    }

    const provider = map.get('embedding_provider') || map.get('provider');
    const baseUrl = map.get('embedding_base_url') || map.get('base_url');

    if (!provider || !baseUrl) return null;

    return {
      provider,
      baseUrl,
      apiKey: decryptApiKey(map, 'embedding') || decryptApiKey(map, 'writing'),
      model: map.get('embedding_model') || 'text-embedding-3-small',
    };
  },

  async hasApiKey(kind: ModelConfigKind = 'writing'): Promise<boolean> {
    const db = getDb();
    const keys =
      kind === 'writing'
        ? [`${API_KEY_PREFIX}writing`, `${API_KEY_PREFIX}data`]
        : [`${API_KEY_PREFIX}embedding`, `${API_KEY_PREFIX}data`];
    const rows = await db.select().from(settings).where(eq(settings.key, keys[0])).all();
    if (rows.length > 0) return true;
    const legacyRow = await db.select().from(settings).where(eq(settings.key, keys[1])).get();
    return Boolean(legacyRow?.value);
  },
};

function decryptApiKey(
  map: Map<string, string>,
  kind: ModelConfigKind,
  modelConfigId?: string,
): string {
  const specificKey = modelConfigId ? map.get(`${API_KEY_PREFIX}${kind}:${modelConfigId}`) : '';
  const encryptedB64 =
    specificKey || map.get(`${API_KEY_PREFIX}${kind}`) || map.get(`${API_KEY_PREFIX}data`);
  if (!encryptedB64 || !isEncryptionAvailable()) return '';

  const buffer = Buffer.from(encryptedB64, 'base64');
  return safeStorage.decryptString(buffer);
}
