import type { WritingStatus } from '@app/core';

export function shouldLoadHistoryProject(
  routeProjectId: string | undefined,
  lastLoadedRouteProjectId: string | null,
): boolean {
  return Boolean(routeProjectId && routeProjectId !== lastLoadedRouteProjectId);
}

export function shouldResetWritingNav(status: WritingStatus | 'idle', pathname: string): boolean {
  return pathname.startsWith('/history/') || status === 'done' || status === 'error';
}
