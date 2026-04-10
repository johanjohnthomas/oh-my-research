# Research Workflow Architecture

Oh My Research uses a staged research workflow rather than a general-purpose orchestration harness.

## Stages

The implemented workflow stages are:

- ingest
- extract
- synthesize
- draft
- review
- export

These stages are modeled in `src/features/research-workflow/contracts.ts` and executed through the research workflow runner.

## Roles

The workflow also defines research-role summaries for:

- ingest
- extract
- synthesize
- draft
- review
- export
- obsidian
- knowledge-graph

Those roles are documented in `src/features/research-workflow/roles.ts`.

The repository still contains compatibility layers from the original harness, but the authoritative workflow for users is the current CLI and `.research/` artifact flow.
