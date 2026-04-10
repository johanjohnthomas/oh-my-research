# Oh My Research

Oh My Research is a local-first system for producing evidence-backed scientific papers in LaTeX.

The target workflow is local-first and centered on a single paper: ingest references from Zotero, extract grounded evidence, track claims and empirical proof, draft a manuscript, verify citations and evidence coverage, then compile a paper with bibliography. Obsidian export/open and knowledge-graph generation are intended as first-class local features, but canonical state remains the manuscript, bibliography, claims, evidence, and verification artifacts.

## Current Status

The first release centers on a research-first operator workflow built around canonical `.research/` artifacts, installed CLI commands, and reproducible local verification.

## V1 Scope

- local-first workflow
- Zotero as the only bibliography authority
- LaTeX manuscript output with bibliography
- executable support for empirical claims
- machine-readable verification artifacts
- first-class local Obsidian export/open flow
- first-class local derived knowledge graph support

## Non-Goals for V1

- multi-source bibliography backends
- bidirectional Obsidian sync
- knowledge graph or vault state becoming canonical
- release automation or platform-specific binary packaging

## Development Commands

```bash
bun run typecheck
bun test
bun run build
bun run verify:product
```

## Runtime Requirement

The published CLI requires Bun on your `PATH`. Install Bun first, then install `oh-my-research`.

## Operator Commands

The installed CLI surface is:

```bash
oh-my-research --help
```

Key commands:

- `oh-my-research workspace-init --title "My Paper" --directory /tmp/research-paper`
- `oh-my-research fixture-run --directory /tmp/research-fixture`
- `oh-my-research workspace-run --workspace /tmp/research-fixture/workspace.json --directory /tmp/research-fixture`
- `oh-my-research workspace-run --workspace /tmp/research-fixture/workspace.json --directory /tmp/research-fixture --reset-state`
- `oh-my-research zotero-sync --library-type users --library-id <your-library-id> --api-key <your-zotero-api-key> --directory /tmp/research-fixture --workspace /tmp/research-fixture/workspace.json`
- `oh-my-research obsidian-export --workspace /tmp/research-fixture/workspace.json --directory /tmp/research-fixture`
- `oh-my-research obsidian-open --vault ResearchVault --note claims --directory /tmp/research-fixture`
- `oh-my-research kg-build --workspace /tmp/research-fixture/workspace.json --directory /tmp/research-fixture`
- `oh-my-research kg-query --directory /tmp/research-fixture --query claim`

`fixture-run` emits both `.research/` artifacts and a reusable `workspace.json` in the target directory. That workspace bundle is a reusable export of the canonical `.research/` state, not a replacement for the canonical artifact tree itself.

`workspace-init` creates a starter workspace bundle for a new paper.

`workspace-run` is the non-fixture operator path for resuming or rerunning the staged workflow against an existing workspace bundle. Use `--reset-state` to intentionally restart from `ingest`.

The fixture workflow also emits:

- machine-readable and human-readable verification reports
- workflow state and stage-run artifacts
- build outputs and proof output
- an export manifest and run metadata with generated-artifact hashes

These commands emit artifacts under `.research/` and are the authoritative operator path for the first release.

`bun run verify:product` runs the current end-to-end product smoke path: build, workspace bootstrap, workflow execution, Obsidian export, knowledge-graph build, and packaged CLI install/run.

## Documentation

- CLI reference: `docs/reference/cli.md`
- Setup guide: `docs/guide/installation.md`

## Current Boundaries

Oh My Research is intentionally scoped to a local-first single-paper workflow. The operator surface does not include the old installer, doctor, publish, or plugin-registration flow.
