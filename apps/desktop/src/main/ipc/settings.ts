import { testConnection } from '@app/ai';
import { IpcChannel } from '@app/core';
import { eq } from 'drizzle-orm';
import { ipcMain } from 'electron';
import { getDb } from '../db/index.js';
import { settings } from '../db/schema.js';
import { keychain } from '../services/keychain.js';
import { buildConnectionTestConfig } from './settings-config.js';

export function registerSettingsIpc(): void {
  ipcMain.handle(IpcChannel.SETTINGS_GET, async (_, key: string) => {
    const db = getDb();
    const row = await db.select().from(settings).where(eq(settings.key, key)).get();
    return row?.value ?? null;
  });

  ipcMain.handle(IpcChannel.SETTINGS_SET, async (_, key: string, value: string) => {
    const db = getDb();
    await db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value } });
  });

  ipcMain.handle(
    IpcChannel.APIKEY_SET,
    async (
      _,
      config: {
        kind?: 'writing' | 'embedding';
        provider: string;
        baseUrl: string;
        apiKey: string;
        model?: string;
        writingModel?: string;
        embeddingModel?: string;
        modelConfigId?: string;
      },
    ) => {
      await keychain.storeApiKey(config);
      return { success: true };
    },
  );

  ipcMain.handle(IpcChannel.APIKEY_HAS, async (_, kind?: 'writing' | 'embedding') =>
    keychain.hasApiKey(kind),
  );

  ipcMain.handle(
    IpcChannel.APIKEY_TEST,
    async (
      _,
      config: {
        kind?: 'writing' | 'embedding';
        baseUrl: string;
        apiKey?: string;
        model?: string;
        writingModel?: string;
        modelConfigId?: string;
      },
    ) => {
      const kind = config.kind ?? 'writing';
      const savedEndpoint =
        kind === 'embedding'
          ? await keychain.getEmbeddingApiConfig(config.modelConfigId)
          : await keychain.getWritingApiConfig(config.modelConfigId);
      const saved = savedEndpoint
        ? {
            provider: savedEndpoint.provider,
            baseUrl: savedEndpoint.baseUrl,
            apiKey: savedEndpoint.apiKey,
            writingModel: kind === 'writing' ? savedEndpoint.model : '',
            embeddingModel: kind === 'embedding' ? savedEndpoint.model : '',
          }
        : null;
      const resolved = buildConnectionTestConfig(config, saved);
      return testConnection(resolved.baseUrl, resolved.apiKey, resolved.model, resolved.kind);
    },
  );
}
