# Contributing

This repository is in an active remake from the original Oh-My-OpenCode harness into a research-first workflow for evidence-backed LaTeX paper development.

## Current Contribution Focus

Contributions should align with the research-first direction:

- canonical `.research/` artifacts
- Zotero-only bibliography authority
- manuscript and verification workflow
- first-class local Obsidian export
- first-class local derived knowledge graph support
- runtime extraction away from legacy host-coupled surfaces

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

## Important Note

Some legacy runtime and compatibility code from the original project still exists during the remake. If you touch those areas, keep changes aligned with the research-first migration path rather than extending the old plugin-era product surface.
