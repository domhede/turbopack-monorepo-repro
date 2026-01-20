# Turbopack Monorepo with outputFileTracingRoot

This repository demonstrates the **correct setup** for a Turbopack + Next.js monorepo with `outputFileTracingRoot`.

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

## Correct Setup (Thanks to Vercel Support!)

**Key insight:** Run all Vercel commands from the **monorepo root**, not from `apps/frontend`.

### 1. Install dependencies

```bash
yarn install
```

### 2. Link project from monorepo root

```bash
vercel link
```

When prompted for "In which directory is your code located?", enter: `./apps/frontend`

### 3. Pull project settings

```bash
vercel pull --yes
```

### 4. Build from monorepo root

```bash
vercel build
```

✅ Build succeeds!

## Common Mistake (What NOT to do)

Running `vercel build` from `apps/frontend` directory causes a path doubling error:

```bash
cd apps/frontend
vercel build  # ❌ FAILS with path doubling
```

```
Error: ENOENT: no such file or directory, lstat 
'.../apps/frontend/apps/frontend/.next/routes-manifest.json'
```

**Always run from the monorepo root instead.**

## Configuration

**next.config.js:**

```js
const path = require("path");

module.exports = {
  outputFileTracingRoot: path.resolve(__dirname, "../.."),
  output: "standalone",
};
```

**Build command in package.json:**

```json
"build": "next build --turbopack"
```

## Environment

- Node.js 24.x
- Next.js 15.3.8
- Vercel CLI 50.4.x

## Why outputFileTracingRoot is needed

In a monorepo, `outputFileTracingRoot` must point to the monorepo root so that:
1. Shared workspace packages (like `@repo/common`) are included in the standalone output
2. The file tracing correctly resolves dependencies across workspace boundaries

## Related

- GitHub Issue (resolved): https://github.com/vercel/next.js/issues/88579
