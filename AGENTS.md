# Repository workflow

- Keep `main` unchanged. Do not commit, merge, rebase, or develop directly on it.
- Perform all project work on `develop` or a dedicated branch created from `develop`.
- Before editing files, verify the active branch with `git branch --show-current`. If it is `main`, switch away from it first.
- `origin` is this fork: `https://github.com/Jialin0701/obsidian-pmp.git`.
- `upstream` is the original project: `https://github.com/StepanKropachev/obsidian-pm.git`.
- Treat upstream synchronization as a separate, explicit operation; do not update `main` unless the user directly requests it.

# Development baseline

- Use Node.js `24.15.0` and pnpm `11.5.3`, as declared in `package.json`.
- Install dependencies with `pnpm install --frozen-lockfile`.
- Before handing off code, run type checks, linters, tests, and a production build.
