import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createOpenAICompatible, getWritingModel } from '@app/ai';
import { describe, expect, it } from 'vitest';
import { generatePlan } from './planner';

const testKeyPath = resolve(process.cwd(), 'TEST_KEY.md');
const runLive = process.env.RUN_TEST_KEY_LIVE === '1' && existsSync(testKeyPath);

const maybeDescribe = runLive ? describe : describe.skip;

maybeDescribe('generatePlan with TEST_KEY.md', () => {
  it('generates a reviewable writing plan with the configured model', async () => {
    const { apiKey, modelId } = readTestKeyConfig();
    const provider = createOpenAICompatible({
      baseUrl: 'https://api.deepseek.com',
      apiKey,
    });

    const plan = await generatePlan(getWritingModel(provider, modelId), {
      type: 'summary',
      topic: '写一份季度工作总结，突出关键成果、问题复盘和下季度计划',
      targetWords: 900,
      style: 'formal',
    });

    expect(plan.goal.length).toBeGreaterThan(0);
    expect(plan.audience.length).toBeGreaterThan(0);
    expect(plan.sections.length).toBeGreaterThan(0);
    expect(plan.totalWordBudget).toBeGreaterThan(0);
  }, 60_000);
});

function readTestKeyConfig(): { apiKey: string; modelId: string } {
  const content = readFileSync(testKeyPath, 'utf-8');
  const apiKey = content.match(/sk-[A-Za-z0-9_-]+/)?.[0];
  const modelId = content.match(/MODEL:\s*([^\s]+)/)?.[1];

  if (!apiKey || !modelId) {
    throw new Error('TEST_KEY.md must contain a DeepSeek API key and MODEL value.');
  }

  return { apiKey, modelId };
}
