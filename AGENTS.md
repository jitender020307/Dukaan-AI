<!-- faf:start -->
<!-- faf: dukaanai-dashboard | TypeScript | frontend | Store dashboard for inventory, barcode lookup, sales, and customer Khata. Supabase Auth is used for sign-in and Supabase Postgres is the source of truth for store data. -->
<!-- faf: claim=project.faf | family=FAF -->

# AGENTS.md — dukaanai-dashboard

Store dashboard for inventory, barcode lookup, sales, and customer Khata. Supabase Auth is used for sign-in and Supabase Postgres is the source of truth for store data. — TypeScript · type: frontend

> Authored by faf — do not edit the managed block; refresh with `faf export --agents`. Hand-written content outside the managed block is preserved.

## Setup & build

```bash
npm run build    # build
npm run dev    # dev
```

## Run the tests

```bash
npm run lint
```

## Where things live

- `package.json`
- `README.md`
- `tsconfig.json`

## Conventions

- ESM modules (`type: module`)

## Guardrails

- **Always OK:** read the tree · build the project · `npm run lint`.
- **Ask first:** dependency installs, deletions, migrations, schema changes, publish/release.
- **Never:** force-push · push straight to `main` (branch and open a PR) · commit secrets.

## Definition of Done

Done when: `npm run lint` exits 0 · changes committed with a conventional message.

## When stuck

Ask a clarifying question, propose a short plan, or open a draft PR with notes — do not push large speculative changes to `main`.

## Security & secrets

- Secrets live in `.env` (see `.env.example`). Never read or commit them.

## Commit & PR

- Conventional Commits preferred (`feat:`, `fix:`, `chore:`, …).
- Branch off `main` and open a PR — never commit to `main` directly.
- If build/test scripts or layout change, refresh this file in the **same PR** (`faf export --agents`).

## Stack

- **Framework:** React
- **CSS:** Tailwind CSS
- **Build:** Vite 8
<!-- faf:end -->
