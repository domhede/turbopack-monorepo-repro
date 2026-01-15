# Bug: Turbopack path doubling in monorepo with outputFileTracingRoot

This repository provides a minimal reproduction of a Vercel/Next.js Turbopack bug where the build path gets doubled when using `outputFileTracingRoot` in a monorepo setup.

## Structure

```
turbopack-monorepo-repro/
├── package.json                 # Workspace root with yarn workspaces
├── tsconfig.base.json           # Shared tsconfig with path aliases
├── apps/
│   └── frontend/
│       ├── package.json         # Next.js 15 app
│       ├── tsconfig.json        # Extends ../../tsconfig.base.json
│       ├── next.config.js       # With turbopack.root and outputFileTracingRoot
│       └── app/
│           ├── layout.tsx
│           └── page.tsx         # Imports from @repo/common
└── libs/
    └── common/
        ├── package.json
        └── src/
            └── index.ts         # Exports a simple greet() function
```

## Steps to reproduce

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

5. Run the Vercel build:
   ```bash
   npx vercel build
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
- Next.js 15.3.3
- Vercel CLI 50.4.0

## Configuration

The `next.config.js` contains:

```js
const path = require('path');

module.exports = {
  turbopack: {
    root: path.resolve(__dirname, '../..'),
  },
  outputFileTracingRoot: path.resolve(__dirname, '../..'),
  output: 'standalone',
};
```

## Notes

- **Without `outputFileTracingRoot`**: `turbopack.root` is ignored and module resolution fails for workspace packages
- **With `outputFileTracingRoot`**: Path doubling occurs during the build
- **There is no working configuration** for Turbopack production builds in monorepos with shared packages
- **`next build` works fine**: The standard Next.js build succeeds, but `vercel build` fails with path doubling

## Workaround

Currently, there is no known workaround that allows both:
1. Proper module resolution for monorepo packages
2. Successful Vercel builds with Turbopack

## Related Issues

- This appears to be related to how Vercel CLI calculates output paths when `outputFileTracingRoot` points to a parent directory
