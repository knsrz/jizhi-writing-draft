// packages/core/src/ipc-channels.ts

export const IpcChannel = {
  KB_LIST: 'kb:list',
  KB_CREATE: 'kb:create',
  KB_DELETE: 'kb:delete',
  KB_DOC_LIST: 'kb:doc-list',
  KB_DOC_DELETE: 'kb:doc-delete',
  KB_UPLOAD: 'kb:upload',
  KB_UPLOAD_PROGRESS: 'kb:upload-progress',
  KB_SEARCH: 'kb:search',

  WRITING_START: 'writing:start',
  WRITING_CREATE_PLAN: 'writing:create-plan',
  WRITING_EXECUTE: 'writing:execute',
  WRITING_CANCEL: 'writing:cancel',
  WRITING_PLAN: 'writing:plan',
  WRITING_SECTION: 'writing:section',
  WRITING_PROGRESS: 'writing:progress',
  WRITING_DONE: 'writing:done',
  WRITING_ERROR: 'writing:error',
  WRITING_RETRY_SECTION: 'writing:retry-section',
  WRITING_REVISE: 'writing:revise',

  PROJECT_LIST: 'project:list',
  PROJECT_GET: 'project:get',

  VERSION_LIST: 'version:list',
  VERSION_GET: 'version:get',
  VERSION_LATEST: 'version:latest',
  VERSION_RESTORE: 'version:restore',

  EXPORT_MD: 'export:md',
  EXPORT_DOCX: 'export:docx',

  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  APIKEY_SET: 'apikey:set',
  APIKEY_HAS: 'apikey:has',
  APIKEY_TEST: 'apikey:test',
  MODEL_LIST: 'model:list',
} as const;

export type IpcChannelValue = (typeof IpcChannel)[keyof typeof IpcChannel];
