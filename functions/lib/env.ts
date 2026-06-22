/// <reference types="@cloudflare/workers-types" />

export interface Env {
  /** KV namespace caching immutable SMHI source files. */
  CACHE?: KVNamespace;
}

export interface ApiContext {
  request: Request;
  env: Env;
  waitUntil: (promise: Promise<unknown>) => void;
}
