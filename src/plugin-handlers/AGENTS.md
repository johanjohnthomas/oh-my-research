# src/plugin-handlers/ — Transitional Host/Plugin Integration Layer

## Current Reality

These handlers still connect the runtime to the host/plugin surface inherited from the original harness.

## Research-First Boundary

The current research-first operator story does **not** treat this directory as the main user-facing surface. Instead, the supported operator path is defined by the CLI and the canonical `.research/` artifact workflow.

## What This Directory Still Does

- config handling for host/plugin integration
- command/agent/plugin component loading
- MCP and skill-related host glue

## Transition Note

This directory remains under active extraction. When modifying it, prefer changes that reduce host/plugin coupling and move implementation ownership toward the host-neutral `host-*` surfaces.
