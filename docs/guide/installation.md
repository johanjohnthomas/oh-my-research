# Installation

Install the published CLI.

First install Bun and confirm it is available on your `PATH`:

```bash
bun --version
```

Then install the package:

```bash
npm install -g @johanjohnthomas/oh-my-research
```

Then verify the installed command:

```bash
oh-my-research --help
```

If OpenCode is already installed on the machine, the first CLI invocation automatically writes the matching OpenCode plugin entry and a default `oh-my-research` config file.

## Local Development Setup

Install dependencies:

```bash
bun install
```

Verify the repository state:

```bash
bun run typecheck
bun test
bun run build
bun run verify:product
```

`verify:product` is the fastest way to confirm the packaged CLI and the current research workflow both still work together.

Check the available CLI commands:

```bash
oh-my-research --help
```

## Quick Start

Initialize a starter paper workspace:

```bash
oh-my-research workspace-init --title "My Paper" --directory /tmp/research-paper
```

Then run the workflow against that workspace bundle:

```bash
oh-my-research workspace-run --workspace /tmp/research-paper/workspace.json --directory /tmp/research-paper
```

If you need to intentionally restart from the beginning instead of resuming from saved workflow state:

```bash
oh-my-research workspace-run --workspace /tmp/research-paper/workspace.json --directory /tmp/research-paper --reset-state
```

## Fixture Path

Run the built-in local paper workflow fixture:

```bash
oh-my-research fixture-run --directory /tmp/research-fixture
```

Then inspect the emitted artifacts under:

```text
/tmp/research-fixture/workspace.json
/tmp/research-fixture/.research/
```

To rerun the workflow against an existing workspace bundle:

```bash
oh-my-research workspace-run --workspace /tmp/research-fixture/workspace.json --directory /tmp/research-fixture
```

By default, `workspace-run` resumes from saved workflow state. Use `--reset-state` when you want an intentional full rerun from `ingest`.

Important outputs include verification reports, workflow state, build outputs, proof output, export manifest, and run metadata under `.research/`.

## Zotero Sync

To sync real references from Zotero into the canonical bibliography artifacts, run:

```bash
oh-my-research zotero-sync --library-type users --library-id <your-library-id> --api-key <your-zotero-api-key> --directory /tmp/research-fixture --workspace /tmp/research-fixture/workspace.json
```

Use credentials and a library ID that you actually control or can read. The command is meant for real Zotero access, not as an anonymous public example.

## Workspace-Based Commands

Once you have a workspace JSON file matching the canonical research artifact schema, you can run:

```bash
oh-my-research obsidian-export --workspace /tmp/research-fixture/workspace.json --directory /tmp/research-fixture
oh-my-research obsidian-open --vault ResearchVault --note claims --directory /tmp/research-fixture
oh-my-research kg-build --workspace /tmp/research-fixture/workspace.json --directory /tmp/research-fixture
oh-my-research kg-query --directory /tmp/research-fixture --query claim
```

The emitted `workspace.json` is a reusable export bundle derived from the canonical `.research/` artifact tree.

Derived commands also update run metadata and export manifest coverage for the generated Obsidian and knowledge-graph artifacts.

## Current Status

Legacy installer, doctor, publish, and plugin-registration documentation from the original codebase is no longer part of the released operator surface. Use the research-first CLI reference in `docs/reference/cli.md` instead.
