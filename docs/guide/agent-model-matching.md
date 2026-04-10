# Model Notes

The first release does not expose a user-facing model-selection guide.

## What Is Stable Today

The stable operator surface is the research workflow CLI documented in:

- `README.md`
- `docs/reference/cli.md`
- `docs/guide/installation.md`

The repository still contains runtime and compatibility code from the original agent harness, including legacy model-routing concepts. Those internal paths are not part of the first-release operator contract.

## Practical Guidance

Treat model usage as an implementation detail behind:

- the local research workflow
- the canonical `.research/` artifact flow
- the staged workflow roles defined in `src/features/research-workflow/roles.ts`

For the first release, use the installed CLI and verification workflows rather than relying on internal model-routing details.
