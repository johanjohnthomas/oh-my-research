# Configuration Reference

The supported first-release configuration surface is intentionally narrow.

## What Is Stable Today

The stable user-facing contract is:

- the canonical `.research/` artifact layout
- the research-first CLI commands in `docs/reference/cli.md`

## What Is Not Yet Finalized

The repository still contains host-adapter and compatibility code from the original OpenCode-based harness. Those internal configuration surfaces are not part of the first-release product contract.

## Current Guidance

If you need to work with the released research workflow today:

1. use `fixture-run` to generate a local `.research/` workspace
2. use canonical workspace JSON as the input to `obsidian-export` and `kg-build`
3. treat `.research/` artifacts as the source of truth rather than legacy plugin config flows

Use canonical `.research/` artifacts and the installed CLI as the supported configuration surface for the first release.
