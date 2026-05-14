import { describe, expect, it } from 'vitest';
import {
  createModelEntry,
  filterModelEntriesForEndpoint,
  parseModelEntries,
  upsertModelEntry,
} from './model-config';

describe('model-config catalog helpers', () => {
  it('creates a stable catalog entry from a saved writing endpoint', () => {
    const entry = createModelEntry('writing', {
      provider: 'openrouter',
      baseUrl: 'https://openrouter.ai/api/v1/',
      model: 'openai/gpt-4o',
    });

    expect(entry).toEqual({
      id: 'openrouter|https%3A%2F%2Fopenrouter.ai%2Fapi%2Fv1|openai%2Fgpt-4o',
      kind: 'writing',
      provider: 'openrouter',
      baseUrl: 'https://openrouter.ai/api/v1',
      model: 'openai/gpt-4o',
      name: 'openai/gpt-4o',
    });
  });

  it('upserts models by provider, base url, and model without duplicating them', () => {
    const first = createModelEntry('embedding', {
      provider: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      model: 'text-embedding-3-small',
    });

    const list = upsertModelEntry([first], {
      kind: 'embedding',
      provider: 'openai',
      baseUrl: 'https://api.openai.com/v1/',
      model: 'text-embedding-3-small',
      name: 'Small embedding',
    });

    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      id: first.id,
      name: 'Small embedding',
      baseUrl: 'https://api.openai.com/v1',
    });
  });

  it('parses only valid entries for the requested kind', () => {
    const parsed = parseModelEntries(
      JSON.stringify([
        {
          id: 'valid',
          kind: 'writing',
          provider: 'openai',
          baseUrl: 'https://api.openai.com/v1',
          model: 'gpt-4o',
          name: 'GPT-4o',
        },
        {
          id: 'wrong-kind',
          kind: 'embedding',
          provider: 'openai',
          baseUrl: 'https://api.openai.com/v1',
          model: 'text-embedding-3-small',
          name: 'Embedding',
        },
        { id: 'missing-fields', kind: 'writing' },
      ]),
      'writing',
    );

    expect(parsed).toEqual([
      {
        id: 'valid',
        kind: 'writing',
        provider: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4o',
        name: 'GPT-4o',
      },
    ]);
  });

  it('filters saved models to the current provider endpoint', () => {
    const openai = createModelEntry('writing', {
      provider: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o',
    });
    const deepseek = createModelEntry('writing', {
      provider: 'deepseek',
      baseUrl: 'https://api.deepseek.com/',
      model: 'deepseek-chat',
    });

    expect(
      filterModelEntriesForEndpoint([openai, deepseek], {
        provider: 'deepseek',
        baseUrl: 'https://api.deepseek.com',
      }),
    ).toEqual([deepseek]);
  });
});
