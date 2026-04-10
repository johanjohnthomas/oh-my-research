# Overview

Oh My Research is a local-first workflow for iterating toward an evidence-backed scientific paper in LaTeX.

## Workflow Shape

Oh My Research centers on one paper at a time and uses canonical artifacts under `.research/`:

1. ingest references
2. extract evidence
3. synthesize claims
4. draft manuscript artifacts
5. verify evidence, bibliography, and compile status
6. export derived views such as Obsidian notes and a knowledge graph

## Source of Truth

Canonical state lives in research artifacts such as:

- manuscript
- bibliography export
- evidence
- claims
- verification reports
- run metadata

Obsidian and knowledge-graph outputs are derived, not canonical.

## How To Use It Today

- start with `oh-my-research fixture-run --directory /tmp/research-fixture`
- inspect the emitted `.research/` artifacts
- use `obsidian-export`, `kg-build`, and `kg-query` with a workspace JSON file when needed

The repository still contains compatibility code from the original agent harness, but the supported user-facing story is the research workflow described in the README and CLI reference.
