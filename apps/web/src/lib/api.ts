import type { AppType } from '@transferflow/api/app';
import { hc } from 'hono/client';

export const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

/**
 * End-to-end type-safe RPC client. `AppType` is inferred straight from the Hono
 * app in `@transferflow/api`, so request/response types stay in sync with the
 * server automatically — no code generation required.
 */
export const client = hc<AppType>(baseUrl, {
  init: {
    credentials: 'include',
  },
});
