((globalThis as typeof globalThis & {
  defineEventHandler?: (handler: unknown) => unknown;
}).defineEventHandler = (handler) => handler);
