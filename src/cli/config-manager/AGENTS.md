# src/cli/config-manager/ — Transitional Config Utilities

## Current Reality

This directory contains configuration and package-management helpers inherited from the original host/plugin harness.

## Important Boundary

These utilities are **not** the primary operator surface for the current research workflow. They remain in the tree only because the runtime extraction is still in progress and some compatibility behavior still depends on them.

## Current Research-First Operator Path

The current supported user-facing path is centered on:

- `workspace-init`
- `workspace-run`
- `fixture-run`
- `zotero-sync`
- `obsidian-export`
- `obsidian-open`
- `kg-build`
- `kg-query`

Those commands are defined in `src/cli/cli-program.ts` and documented in `README.md` and `docs/reference/cli.md`.

## Transition Note

When editing files in this directory, prefer changes that reduce legacy host/plugin coupling rather than extending the old installer-era product surface.
