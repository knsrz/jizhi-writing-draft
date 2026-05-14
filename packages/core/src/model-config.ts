export type ModelConfigKind = 'writing' | 'embedding';

export interface SavedModelEntry {
  id: string;
  kind: ModelConfigKind;
  provider: string;
  baseUrl: string;
  model: string;
  name: string;
}

export interface ModelEntryDraft {
  kind?: ModelConfigKind;
  provider: string;
  baseUrl: string;
  model: string;
  name?: string;
}

export const MODEL_LIST_SETTING_KEYS: Record<ModelConfigKind, string> = {
  writing: 'writing_models',
  embedding: 'embedding_models',
};

export function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, '');
}

export function createModelEntry(kind: ModelConfigKind, draft: ModelEntryDraft): SavedModelEntry {
  const provider = draft.provider.trim() || 'custom';
  const baseUrl = normalizeBaseUrl(draft.baseUrl);
  const model = draft.model.trim();
  const name = draft.name?.trim() || model;

  return {
    id: [provider, baseUrl, model].map(encodeURIComponent).join('|'),
    kind,
    provider,
    baseUrl,
    model,
    name,
  };
}

export function upsertModelEntry(
  entries: SavedModelEntry[],
  draft: ModelEntryDraft & { kind: ModelConfigKind },
): SavedModelEntry[] {
  const entry = createModelEntry(draft.kind, draft);
  const index = entries.findIndex((item) => item.id === entry.id);

  if (index === -1) {
    return [...entries, entry];
  }

  const next = [...entries];
  next[index] = entry;
  return next;
}

export function parseModelEntries(raw: unknown, kind: ModelConfigKind): SavedModelEntry[] {
  if (!raw) return [];

  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((item) => {
      if (!isRecord(item)) return [];
      if (item.kind !== kind) return [];
      if (
        typeof item.id !== 'string' ||
        typeof item.provider !== 'string' ||
        typeof item.baseUrl !== 'string' ||
        typeof item.model !== 'string' ||
        typeof item.name !== 'string'
      ) {
        return [];
      }

      const entry: SavedModelEntry = {
        id: item.id,
        kind,
        provider: item.provider.trim(),
        baseUrl: normalizeBaseUrl(item.baseUrl),
        model: item.model.trim(),
        name: item.name.trim() || item.model.trim(),
      };

      if (!entry.provider || !entry.baseUrl || !entry.model || !entry.name) return [];
      return [entry];
    });
  } catch {
    return [];
  }
}

export function serializeModelEntries(entries: SavedModelEntry[]): string {
  return JSON.stringify(entries);
}

export function filterModelEntriesForEndpoint(
  entries: SavedModelEntry[],
  endpoint: Pick<ModelEntryDraft, 'provider' | 'baseUrl'>,
): SavedModelEntry[] {
  const provider = endpoint.provider.trim();
  const baseUrl = normalizeBaseUrl(endpoint.baseUrl);

  return entries.filter(
    (entry) => entry.provider === provider && normalizeBaseUrl(entry.baseUrl) === baseUrl,
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
