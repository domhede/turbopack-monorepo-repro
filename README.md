# Bug: Turbopack path doubling in monorepo with outputFileTracingRoot

This repository provides a minimal reproduction of a Vercel/Next.js Turbopack bug where the build path gets doubled when using `outputFileTracingRoot` in a monorepo setup with **local `vercel build`**.

## Structure

```
turbopack-monorepo-repro/
├── package.json                 # Workspace root with yarn workspaces
├── tsconfig.base.json           # Shared tsconfig with path aliases
├── apps/
│   └── frontend/
│       ├── package.json         # Next.js 15.3.8 app
│       ├── tsconfig.json        # Extends ../../tsconfig.base.json
│       ├── next.config.js       # With outputFileTracingRoot
│       └── app/
│           ├── layout.tsx
│           └── page.tsx         # Imports from @repo/common
└── libs/
    └── common/
        ├── package.json
        └── src/
            └── index.ts         # Exports a simple greet() function
```

## Steps to reproduce (LOCAL vercel build)

**Important:** This bug occurs with `npx vercel build` run locally, NOT through the Vercel dashboard.

1. Install dependencies:

   ```bash
   yarn install
   ```

2. Authenticate with Vercel CLI (required):

   ```bash
   npx vercel login
   ```

3. Navigate to the frontend app:

   ```bash
   cd apps/frontend
   ```

4. Link the project (select defaults when prompted):

   ```bash
   npx vercel link
   ```

5. Run the Vercel build locally:

   ```bash
   unset VERCEL_PROJECT_ID VERCEL_ORG_ID VERCEL_TOKEN && npx vercel build
   ```

## Expected

Build succeeds and produces a working standalone output.

## Actual

Error: ENOENT: no such file or directory, lstat

```
'.../apps/frontend/apps/frontend/.next/routes-manifest.json'
```

The path `apps/frontend/` is doubled because `outputFileTracingRoot` causes the build to prepend the relative path from monorepo root, but we're already in that directory.

## Environment

- Node.js 24.x
- Next.js 15.3.8
- Vercel CLI 50.4.0

## Configuration

The `next.config.js` contains:

```js
const path = require("path");

module.exports = {
  outputFileTracingRoot: path.resolve(__dirname, "../.."),
  output: "standalone",
};
```

Build command in `package.json`:

```json
"build": "next build --turbopack"
```

## Why outputFileTracingRoot is needed

In a monorepo, `outputFileTracingRoot` must point to the monorepo root so that:
1. Shared workspace packages (like `@repo/common`) are included in the standalone output
2. The file tracing correctly resolves dependencies across workspace boundaries

Without `outputFileTracingRoot`, the standalone build would miss the `libs/common` package.

## Why root directory should be apps/frontend (response to Vercel support)

Setting the Vercel project root to `apps/frontend` works for **dashboard deployments**. However:

1. **Local `vercel build`** is run from `apps/frontend` directory, and the path doubling occurs there
2. Many CI/CD pipelines use `vercel build` locally before deploying
3. The bug demonstrates an inconsistency in how `outputFileTracingRoot` interacts with the current working directory

## Notes

- **Dashboard deployment with root=apps/frontend works** - Vercel support confirmed this
- **Local `vercel build` fails** - Path doubling occurs when running from apps/frontend
- **`next build --turbopack` works fine** - The standard Next.js build succeeds
- **`vercel build` locally fails** - Path doubling only occurs with Vercel CLI

## Workaround

Set the root directory to `apps/frontend` in Vercel dashboard settings when deploying through the dashboard. However, this doesn't fix local `vercel build` usage.

## Related Issues

- GitHub Issue: https://github.com/vercel/next.js/issues/88579
