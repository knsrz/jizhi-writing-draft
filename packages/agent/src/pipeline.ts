import { tokenCounter } from '@app/ai';
import type { SectionOutput, WritingPlan, WritingRequest } from '@app/core';
import type { Retriever } from '@app/knowledge';
import type { LanguageModel } from 'ai';
import { generatePlan } from './planner.js';
import { factCheckSection } from './sub-agents/fact-check.js';
import { polishSection } from './sub-agents/polish.js';
import { writeSection } from './writer.js';

export interface PipelineCallbacks {
  onPlanReady: (plan: WritingPlan) => void;
  onSectionStart: (index: number, title: string) => void;
  onSectionWriting: (section: SectionOutput) => void;
  onSectionFactCheck: (index: number, content: string) => void;
  onSectionPolish: (index: number, content: string) => void;
  onProgress: (percent: number) => void;
  onError: (error: Error) => void;
}

export async function runPipeline(
  request: WritingRequest,
  writingModel: LanguageModel,
  retriever: Retriever | null,
  callbacks: PipelineCallbacks,
  options?: { signal?: AbortSignal },
): Promise<string> {
  try {
    throwIfAborted(options?.signal);
    callbacks.onProgress(5);
    const plan = await generatePlan(
      writingModel,
      request,
      retriever ?? undefined,
      request.knowledgeBaseId ?? undefined,
      options,
    );
    throwIfAborted(options?.signal);
    callbacks.onPlanReady(plan);
    callbacks.onProgress(10);

    const sections: SectionOutput[] = [];

    for (let i = 0; i < plan.sections.length; i++) {
      const sectionPlan = plan.sections[i];
      throwIfAborted(options?.signal);
      callbacks.onSectionStart(i, sectionPlan.title);

      const gen = writeSection(
        writingModel,
        sectionPlan,
        i,
        plan,
        request.style,
        retriever ?? undefined,
        request.knowledgeBaseId ?? undefined,
        options,
      );

      for await (const section of gen) {
        throwIfAborted(options?.signal);
        callbacks.onSectionWriting(section);

        let content = section.content;
        if (retriever && request.knowledgeBaseId && sectionPlan.needsRAG) {
          const refs = await retriever.search(
            request.knowledgeBaseId,
            sectionPlan.keywords.join(' '),
            5,
          );
          const refContext = refs.map((r) => r.content).join('\n\n');
          content = await factCheckSection(writingModel, section.content, refContext, options);
          callbacks.onSectionFactCheck(i, content);
        }

        throwIfAborted(options?.signal);
        content = await polishSection(writingModel, content, request.style, options);
        callbacks.onSectionPolish(i, content);

        sections.push({ sectionIndex: i, title: section.title, content });
      }

      const phaseProgress = 10 + Math.round(((i + 1) / plan.sections.length) * 75);
      callbacks.onProgress(phaseProgress);
    }

    callbacks.onProgress(90);
    const fullText = sections.map((s) => `## ${s.title}\n\n${s.content}`).join('\n\n');

    const actualWords = tokenCounter.countWords(fullText);
    if (actualWords > request.targetWords * 1.15) {
      const { generateText } = await import('ai');
      const result = await generateText({
        model: writingModel,
        system: '压缩以下文章到约目标字数，保留所有关键信息和结构。只输出压缩后的文章。',
        prompt: `目标字数：${request.targetWords}字\n\n${fullText}`,
        temperature: 0.3,
        abortSignal: options?.signal,
      });
      callbacks.onProgress(100);
      return result.text;
    }

    callbacks.onProgress(100);
    return fullText;
  } catch (e) {
    if (!options?.signal?.aborted) {
      callbacks.onError(e instanceof Error ? e : new Error(String(e)));
    }
    throw e;
  }
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new Error('Writing cancelled');
}
