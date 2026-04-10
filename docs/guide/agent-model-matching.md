# Model Notes

The current research-first remake does not yet expose a finalized user-facing model-selection guide.

## What Is Stable Today

The stable operator surface is the research workflow CLI documented in:

- `README.md`
- `docs/reference/cli.md`
- `docs/guide/installation.md`

## Current Reality

The repository still contains runtime and compatibility code from the original agent harness, including legacy model-routing concepts. Those internal paths are still under extraction and should not be treated as the finalized model-selection story for the remake.

## Practical Guidance

For the current remake, treat model usage as an implementation detail behind:

- the local research workflow
- the canonical `.research/` artifact flow
- the staged workflow roles defined in `src/features/research-workflow/roles.ts`

When the research-specific runtime surface is finalized, this guide should be replaced with the actual model and runtime guidance that applies to the stabilized research product.
