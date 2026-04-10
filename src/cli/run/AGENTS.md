# src/cli/run/ — Transitional Runtime Session Path

## Current Reality

This directory still powers the generic `run <message>` path, which remains available during the remake as a transitional host/runtime session entrypoint.

## Important Boundary

This is **not** the primary single-paper operator surface for the research workflow. The main research-first commands live in `src/cli/cli-program.ts` and include:

- `workspace-init`
- `workspace-run`
- `fixture-run`
- `zotero-sync`
- `obsidian-export`
- `obsidian-open`
- `kg-build`
- `kg-query`

## Why This Directory Still Exists

The repo is mid-extraction from the original host/plugin harness. The generic `run` flow is still useful as a compatibility path, but it should be treated as transitional rather than as the canonical operator story for the remake.

## Source of Truth

For current operator behavior, prefer:

- `README.md`
- `docs/reference/cli.md`
- `docs/guide/installation.md`
- `src/cli/cli-program.ts`
