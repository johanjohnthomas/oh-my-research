# Configuration Reference

The current remake does not yet expose a finalized research-specific configuration system beyond the existing development/runtime code that remains under transition.

## What Is Stable Today

The stable user-facing contract for the remake is:

- the canonical `.research/` artifact layout
- the research-first CLI commands in `docs/reference/cli.md`
- the implementation plan in `.sisyphus/plans/research-first-remake.md`

## What Is Not Yet Finalized

The repository still contains host-adapter and compatibility code from the original OpenCode-based harness. Those internal configuration surfaces are still under extraction and should not be treated as the long-term research-product configuration model.

## Current Guidance

If you need to work with the remake today:

1. use `fixture-run` to generate a local `.research/` workspace
2. use canonical workspace JSON as the input to `obsidian-export` and `kg-build`
3. treat `.research/` artifacts as the source of truth rather than legacy plugin config flows

When the research-specific config surface is finalized, this document should be replaced with the actual schema, file locations, and examples for that system.
