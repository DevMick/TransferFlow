# TransferFlow

A full-stack TypeScript monorepo demo for money transfers, built on a modern 2026 stack.

## Stack

| Layer          | Technology                                                                 |
| -------------- | -------------------------------------------------------------------------- |
| Monorepo       | pnpm workspaces + Turborepo                                                |
| Language/Tools | TypeScript · Biome (lint + format)                                         |
| Frontend       | React 19 · Vite · Ant Design 5 · React Router v7 · Zustand · TanStack Query · Zod |
| Backend        | Hono (+ Hono RPC) · PostgreSQL 17 · Drizzle ORM · Better-Auth · Zod        |
| Testing        | Vitest (unit/integration) · Playwright (E2E)                              |

## Layout

```
apps/
  api/    Hono API — Drizzle schema/migrations, Better-Auth, RPC routes
  web/    React 19 SPA — Ant Design UI, TanStack Query, type-safe RPC client
packages/
  shared/             Zod schemas shared across api + web
  typescript-config/  Shared tsconfig bases
```

The web app imports the API's `AppType` (type-only) so RPC calls are fully typed
end-to-end with no code generation.

## Prerequisites

- Node.js 22 LTS (or Bun) · pnpm 10 · Docker (for PostgreSQL)

## Getting started

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env            # then edit BETTER_AUTH_SECRET

# 3. Start PostgreSQL 17
docker compose up -d

# 4. Create the database schema
pnpm db:generate                # generate SQL migrations from the Drizzle schema
pnpm db:migrate                 # apply them

# 5. Run everything (api on :3000, web on :5173)
pnpm dev
```

## Common scripts

| Command             | Description                                    |
| ------------------- | ---------------------------------------------- |
| `pnpm dev`          | Run api + web in parallel (Turborepo)          |
| `pnpm build`        | Build all packages                             |
| `pnpm lint`         | Biome lint + format check                      |
| `pnpm lint:fix`     | Auto-fix lint/format issues                    |
| `pnpm typecheck`    | TypeScript type-check across the workspace     |
| `pnpm test`         | Run Vitest unit/integration tests              |
| `pnpm test:e2e`     | Run Playwright end-to-end tests                |
| `pnpm db:generate`  | Generate Drizzle migrations                    |
| `pnpm db:migrate`   | Apply Drizzle migrations                       |
| `pnpm db:studio`    | Open Drizzle Studio                            |

## Notes

- **Build tool:** Vite is used for the web app. To swap in Rspack, replace
  `vite` + `@vitejs/plugin-react` with `@rspack/core` + `@rspack/cli` and add an
  `rspack.config.ts`; the rest of the app code is unchanged.
- Before running Playwright the first time: `pnpm --filter @transferflow/web exec playwright install`.
