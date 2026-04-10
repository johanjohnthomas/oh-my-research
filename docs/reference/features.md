# Features Reference

The authoritative feature set is the local paper workflow implemented in `src/features/research-*` and exposed through the CLI commands documented in `docs/reference/cli.md`.

## Current Research Workflow Features

### Canonical Research Artifacts

The system models research work through canonical artifacts under `.research/`:

- manuscript
- references
- evidence
- claims
- runs
- verification

Derived artifacts are kept separate under `.research/derived/`.

### Bibliography

- Zotero-only bibliography authority
- generated BibTeX export
- freshness verification for generated bibliography artifacts

### Verification

- artifact relationship validation
- empirical-proof validation
- bibliography freshness validation
- compile-status validation
- citation-status validation from build output
- generated-artifact drift validation from run metadata
- human-readable verification report output alongside machine-readable JSON

### Manuscript Workflow

- LaTeX manuscript templates and section files
- compiler abstraction for `latexmk` and `tectonic`
- persisted build-result metadata

### Local Knowledge Features

- Obsidian markdown export under `.research/derived/obsidian/`
- derived knowledge graph output under `.research/derived/knowledge-graph/`

If a feature is not represented in the current CLI reference, README, or `src/features/research-*` implementation, do not treat it as part of the supported research workflow.
