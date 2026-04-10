# Contributing

Oh My Research is a research-first workflow for evidence-backed LaTeX paper development.

## Current Contribution Focus

Contributions should align with the research-first direction:

- canonical `.research/` artifacts
- Zotero-only bibliography authority
- manuscript and verification workflow
- first-class local Obsidian export
- first-class local derived knowledge graph support
- keeping the released research-first operator path stable and verifiable

## Current Workflow

Use Bun for all local work:

```bash
bun install
bun run typecheck
bun test
bun run build
```

The current operator surface is documented in:

- `README.md`
- `docs/reference/cli.md`
- `docs/guide/installation.md`

## Release Checklist

Before publishing a release:

```bash
bun run typecheck
bun test
bun run build
bun run verify:product
npm pack --silent
```

Publish only after the installed `oh-my-research` binary and the packaged `research-runtime` entrypoint both verify successfully.

For the scoped public release, publish with:

```bash
npm publish --access public
```

## Important Note

Some legacy runtime and compatibility code from the original project still exists. If you touch those areas, keep changes aligned with the released research-first product surface rather than extending the old plugin-era behavior.
