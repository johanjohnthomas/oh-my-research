# src/features/mcp-oauth/ — MCP OAuth Compatibility Utilities

## Current Reality

This directory implements OAuth support for MCP servers that require authentication.

## Boundary

It is not part of the primary research workflow operator path, which is centered on:

- `workspace-init`
- `workspace-run`
- `fixture-run`
- `zotero-sync`
- `obsidian-export`
- `obsidian-open`
- `kg-build`
- `kg-query`

## Transition Note

These OAuth utilities remain in the tree as compatibility/runtime support. They should not be treated as the main product story for the research workflow remake.
