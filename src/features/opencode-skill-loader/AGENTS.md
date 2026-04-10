# src/features/opencode-skill-loader/ — Skill Discovery Compatibility Layer

## Current Reality

This feature still handles discovery/merge behavior across multiple skill locations, including legacy compatibility paths from the original harness.

## Research-First Expectation

The current operator-facing research workflow is documented in `README.md` and `docs/reference/cli.md`. This directory should be treated as a transitional compatibility layer that helps the runtime discover skills without defining the product story itself.

## Active Scope

- config source skill discovery
- global/project skill discovery
- merge behavior across available sources

## Transition Note

Legacy path support may still exist during the extraction, but new work should prefer research-first naming and runtime boundaries.
