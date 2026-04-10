# src/cli/ — Research Workflow CLI

## Current Reality

The CLI in this repository is now centered on the research-first remake, not the original installer/doctor/plugin-registration product surface.

## Active Operator Commands

The current user-facing commands are:

- `workspace-init` — create a starter workspace bundle for a new paper
- `run <message>` — transitional host/runtime session entrypoint
- `version` — show CLI version
- `fixture-run` — emit a local single-paper fixture workflow plus `workspace.json`
- `workspace-run` — run or resume the staged workflow against an existing workspace bundle
- `zotero-sync` — sync Zotero references into canonical bibliography artifacts
- `obsidian-export` — export a workspace JSON file to local Obsidian markdown artifacts
- `obsidian-open` — emit an Obsidian URI for an exported note
- `kg-build` — build a local derived knowledge graph from a workspace JSON file
- `kg-query` — query the local derived knowledge graph for matching nodes and edges

## Transition Note

Some older CLI code and runtime integration paths still exist in `src/cli/` while the repository is being remade. Those internals should not be treated as the long-term product story for the research workflow.

## Source of Truth

For current operator behavior, prefer:

- `src/cli/cli-program.ts`
- `README.md`
- `docs/reference/cli.md`
- `docs/guide/installation.md`
