# src/ — Runtime and Research Workflow Source

## Current Reality

This tree still contains both:

- the research-first workflow/runtime now exposed as the package root via `src/research-runtime.ts`
- compatibility/host integration code retained during the extraction from the original agent harness

## Primary Research-First Surfaces

The most important current implementation areas are:

- `src/research-runtime.ts`
- `src/features/research-artifacts/`
- `src/features/research-workflow/`
- `src/features/research-bibliography/`
- `src/features/research-manuscript/`
- `src/features/research-verification/`
- `src/features/research-obsidian/`
- `src/features/research-knowledge-graph/`
- `src/features/research-reproducibility/`

## Transitional Host Surfaces

The following areas still exist because runtime extraction is not fully complete yet:

- `src/index.ts` (plugin-compatible entrypoint)
- `src/plugin-interface.ts`
- `src/create-{managers,tools,hooks}.ts`
- compatibility loader/hook trees under `src/features/claude-code-*` and `src/hooks/claude-code-hooks/`

## Source of Truth

Prefer the research-first docs and plan over older harness assumptions:

- `README.md`
- `docs/reference/cli.md`
- `docs/guide/installation.md`
- `.sisyphus/plans/research-first-remake.md`
