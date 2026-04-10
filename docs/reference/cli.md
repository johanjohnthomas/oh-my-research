# CLI Reference

Reference for the current `oh-my-research` CLI.

## Basic Usage

```bash
bun run src/cli/index.ts --help
```

For a full product smoke path, use:

```bash
bun run verify:product
```

## Commands

| Command | Description |
| --- | --- |
| `run <message>` | Transitional host/runtime session entrypoint |
| `version` | Show version information |
| `workspace-init` | Create a starter workspace JSON file for a new paper |
| `fixture-run` | Execute the built-in single-paper local workflow fixture |
| `workspace-run` | Execute the research workflow for a supplied workspace JSON file |
| `zotero-sync` | Sync Zotero references into canonical bibliography artifacts |
| `obsidian-export` | Export a workspace JSON file to local Obsidian markdown artifacts |
| `obsidian-open` | Create an Obsidian URI for an exported note |
| `kg-build` | Build a local derived knowledge graph from a workspace JSON file |
| `kg-query` | Query the local derived knowledge graph |

## run

Runs a transitional host/runtime session entrypoint that still exists during the remake.

This command is broader than the primary single-paper research workflow and should not be treated as the main v1 operator path.

```bash
bun run src/cli/index.ts run "Continue the paper workflow"
```

### Options

| Option | Description |
| --- | --- |
| `-a, --agent <name>` | Agent to use for the research session |
| `-m, --model <provider/model>` | Model override |
| `-d, --directory <path>` | Working directory |
| `-p, --port <port>` | Server port |
| `--attach <url>` | Attach to an existing session server URL |
| `--on-complete <command>` | Shell command to run after completion |
| `--json` | Output structured JSON |
| `--no-timestamp` | Disable timestamp prefix |
| `--verbose` | Show full event stream |
| `--session-id <id>` | Resume an existing session |

## workspace-init

Creates a starter `workspace.json` bundle for a new paper.

```bash
bun run src/cli/index.ts workspace-init --title "My Paper" --directory /tmp/research-paper
```

The resulting workspace bundle is intended to be the input for `workspace-run`, `zotero-sync`, `obsidian-export`, and `kg-build`.

## fixture-run

Runs the built-in local single-paper workflow fixture. This is the fastest way to verify the current artifact, workflow, manuscript, verification, and reproducibility plumbing.

```bash
bun run src/cli/index.ts fixture-run --directory /tmp/research-fixture
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
bun run src/cli/index.ts workspace-run --workspace /tmp/research-fixture/workspace.json --directory /tmp/research-fixture
```

To intentionally restart from the beginning instead of resuming from `.research/workflow/state.json`:

```bash
bun run src/cli/index.ts workspace-run --workspace /tmp/research-fixture/workspace.json --directory /tmp/research-fixture --reset-state
```

This command refreshes the canonical `.research/` artifact tree and rewrites `workspace.json` with the resulting run metadata and verification outputs.

Unlike the transitional `run <message>` surface, `workspace-run` is the deterministic research-workflow operator path over a supplied workspace bundle.

## zotero-sync

Fetches references from the Zotero Web API and writes canonical bibliography artifacts.

```bash
bun run src/cli/index.ts zotero-sync --library-type users --library-id <your-library-id> --api-key <your-zotero-api-key> --directory /tmp/research-fixture --workspace /tmp/research-fixture/workspace.json
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
bun run src/cli/index.ts obsidian-export --workspace /tmp/research-fixture/workspace.json --directory /tmp/research-fixture
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
bun run src/cli/index.ts obsidian-open --vault ResearchVault --note claims --directory /tmp/research-fixture
```

Expected result:

- prints an `obsidian://open?...` URI after the note exists
- exits with an error if the requested note has not been exported yet

## kg-build

Builds a local derived knowledge graph from a workspace JSON file.

The simplest input path is the `workspace.json` emitted by `fixture-run`.

```bash
bun run src/cli/index.ts kg-build --workspace /tmp/research-fixture/workspace.json --directory /tmp/research-fixture
```

Expected output:

- `.research/derived/knowledge-graph/graph.json`

After build, the graph artifact is appended to `.research/runs/run-1/metadata.json` and `.research/export/manifest.json`.
The corresponding `workspace.json` run metadata is refreshed as well.

## kg-query

Queries the local derived knowledge graph for matching nodes and connected edges.

```bash
bun run src/cli/index.ts kg-query --directory /tmp/research-fixture --query claim
```

Expected result:

- prints matching node/edge JSON from `.research/derived/knowledge-graph/graph.json`
- exits with an error if the knowledge graph has not been built yet

## version

Shows the current CLI version.

```bash
bun run src/cli/index.ts version
```
