# Research Workflow Architecture

This remake currently uses a staged research workflow rather than the old product story of a general-purpose orchestration harness.

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

The remake also defines research-role summaries for:

- ingest
- extract
- synthesize
- draft
- review
- export
- obsidian
- knowledge-graph

Those roles are documented in `src/features/research-workflow/roles.ts` and are intended to replace the old product-centric taxonomy over time.

## Current Reality

The repository still contains compatibility layers from the original harness, so this architecture should be read as the target research workflow layered on top of a runtime still under extraction. The authoritative workflow for users is the current CLI and `.research/` artifact flow, not the older generalized orchestration docs from the original project.
