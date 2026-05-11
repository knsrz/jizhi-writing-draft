export interface WritingEventsApi {
  onWritingPlan: (cb: (plan: unknown) => void) => () => void;
  onWritingSection: (cb: (section: unknown) => void) => () => void;
  onWritingProgress: (cb: (progress: unknown) => void) => () => void;
  onWritingDone: (cb: (result: unknown) => void) => () => void;
  onWritingError: (cb: (error: string) => void) => () => void;
}

export interface WritingEventHandlers {
  onPlan: (plan: unknown) => void;
  onSection: (section: unknown) => void;
  onProgress: (progress: unknown) => void;
  onDone: (result: unknown) => void;
  onError: (error: string) => void;
}

export function attachWritingListeners(
  api: WritingEventsApi,
  handlers: WritingEventHandlers,
): () => void {
  const cleanups = [
    api.onWritingPlan(handlers.onPlan),
    api.onWritingSection(handlers.onSection),
    api.onWritingProgress(handlers.onProgress),
    api.onWritingDone(handlers.onDone),
    api.onWritingError(handlers.onError),
  ];

  return () => {
    for (const cleanup of cleanups) cleanup();
  };
}
