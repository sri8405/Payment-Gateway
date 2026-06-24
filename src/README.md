# Source Directory

This directory is reserved for the future `src/` migration.

The current application uses the standard root-level Next.js App Router layout:

- `app/`
- `components/`
- `lib/`
- `types/`

Move those folders into `src/` in a dedicated architecture PR, then update `tsconfig.json` path aliases from `@/* -> ./*` to `@/* -> ./src/*`.

