# CLI Reference

Reference for the installed `oh-my-research` CLI.

Install package:

```bash
npm install -g @johanjohnthomas/oh-my-research
```

## Basic Usage

```bash
oh-my-research --help
```

For a full product smoke path, use:

```bash
bun run verify:product
```

If OpenCode is installed, package installation bootstraps the matching OpenCode plugin/config entries automatically.

## Commands

| Command | Description |
| --- | --- |
| `version` | Show version information |
| `workspace-init` | Create a starter workspace JSON file for a new paper |
| `fixture-run` | Execute the built-in single-paper local workflow fixture |
| `workspace-run` | Execute the research workflow for a supplied workspace JSON file |
| `zotero-sync` | Sync Zotero references into canonical bibliography artifacts |
| `obsidian-export` | Export a workspace JSON file to local Obsidian markdown artifacts |
| `obsidian-open` | Create an Obsidian URI for an exported note |
| `kg-build` | Build a local derived knowledge graph from a workspace JSON file |
| `kg-query` | Query the local derived knowledge graph |

## workspace-init

Creates a starter `workspace.json` bundle for a new paper.

```bash
oh-my-research workspace-init --title "My Paper" --directory /tmp/research-paper
```

The resulting workspace bundle is intended to be the input for `workspace-run`, `zotero-sync`, `obsidian-export`, and `kg-build`.

## fixture-run

Runs the built-in local single-paper workflow fixture. This is the fastest way to verify the current artifact, workflow, manuscript, verification, and reproducibility plumbing.

```bash
oh-my-research fixture-run --directory /tmp/research-fixture
```

Expected outputs under the chosen directory include:

- `workspace.json`
- `.research/references/generated.bib`
- `.research/references/zotero-export.json`
- `.research/manuscript/main.tex`
- `.research/manuscript/build-result.json`
- `.research/manuscript/build/main.pdf`
- `.research/manuscript/build/main.log`
- `.research/runs/run-1/output.json`
- `.research/verification/report.json`
- `.research/verification/report.md`
- `.research/workflow/state.json`
- `.research/workflow/stage-runs.json`
- `.research/workflow/error.json` (failure path only)
- `.research/runs/run-1/metadata.json`

## workspace-run

Runs or resumes the same research workflow against a supplied workspace JSON file instead of the built-in fixture.

```bash
oh-my-research workspace-run --workspace /tmp/research-fixture/workspace.json --directory /tmp/research-fixture
```

To intentionally restart from the beginning instead of resuming from `.research/workflow/state.json`:

```bash
oh-my-research workspace-run --workspace /tmp/research-fixture/workspace.json --directory /tmp/research-fixture --reset-state
```

This command refreshes the canonical `.research/` artifact tree and rewrites `workspace.json` with the resulting run metadata and verification outputs.

`workspace-run` is the deterministic research-workflow operator path over a supplied workspace bundle.

## zotero-sync

Fetches references from the Zotero Web API and writes canonical bibliography artifacts.

```bash
oh-my-research zotero-sync --library-type users --library-id <your-library-id> --api-key <your-zotero-api-key> --directory /tmp/research-fixture --workspace /tmp/research-fixture/workspace.json
```

This command requires access to a real Zotero library. Use your own library ID and, when needed, a valid API key with permission to read that library.

### Options

| Option | Description |
| --- | --- |
| `--library-type <users|groups>` | Zotero library type |
| `--library-id <id>` | Zotero library identifier |
| `-w, --workspace <path>` | Optional workspace JSON file to refresh after sync |
| `--api-key <key>` | Zotero API key |
| `--collection-key <key>` | Optional Zotero collection key |
| `--limit <count>` | Maximum number of items to fetch |
| `-d, --directory <path>` | Working directory |

Expected outputs:

- `.research/references/zotero-export.json`
- `.research/references/generated.bib`

If `--workspace` is provided, the bibliography section in that workspace bundle is refreshed too.
- `.research/workflow/error.json` on failed workflow paths that later consume missing artifacts

## obsidian-export

Exports canonical workspace data to local Obsidian-friendly markdown notes.

The simplest input path is the `workspace.json` emitted by `fixture-run`.

```bash
oh-my-research obsidian-export --workspace /tmp/research-fixture/workspace.json --directory /tmp/research-fixture
```

Expected outputs:

- `.research/derived/obsidian/manuscript.md`
- `.research/derived/obsidian/claims.md`
- `.research/derived/obsidian/evidence.md`
- `.research/derived/obsidian/references.md`

After export, derived artifact metadata is appended to `.research/runs/run-1/metadata.json` and `.research/export/manifest.json`.
The corresponding `workspace.json` run metadata is refreshed as well.

## obsidian-open

Creates an Obsidian URI for one of the exported notes.

This command fails if the requested note has not been exported yet.

```bash
oh-my-research obsidian-open --vault ResearchVault --note claims --directory /tmp/research-fixture
```

Expected result:

- prints an `obsidian://open?...` URI after the note exists
- exits with an error if the requested note has not been exported yet

## kg-build

Builds a local derived knowledge graph from a workspace JSON file.

The simplest input path is the `workspace.json` emitted by `fixture-run`.

```bash
oh-my-research kg-build --workspace /tmp/research-fixture/workspace.json --directory /tmp/research-fixture
```

Expected output:

- `.research/derived/knowledge-graph/graph.json`

After build, the graph artifact is appended to `.research/runs/run-1/metadata.json` and `.research/export/manifest.json`.
The corresponding `workspace.json` run metadata is refreshed as well.

## kg-query

Queries the local derived knowledge graph for matching nodes and connected edges.

```bash
oh-my-research kg-query --directory /tmp/research-fixture --query claim
```

Expected result:

- prints matching node/edge JSON from `.research/derived/knowledge-graph/graph.json`
- exits with an error if the knowledge graph has not been built yet

## version

Shows the current CLI version.

```bash
oh-my-research version
```
