import { Command } from "commander"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { runFixtureResearchWorkflow, runResearchWorkspaceWorkflow } from "../features/research-workflow"
import { createFixtureResearchWorkspace, createStarterResearchWorkspace } from "../features/research-workflow/fixture-workspace"
import { researchWorkspaceSchema } from "../features/research-artifacts"
import { createObsidianOpenUri, exportWorkspaceToObsidian } from "../features/research-obsidian"
import { buildKnowledgeGraph, queryKnowledgeGraph, readKnowledgeGraph, writeKnowledgeGraph } from "../features/research-knowledge-graph"
import { syncZoteroBibliography, type ZoteroLibraryType } from "../features/research-bibliography"
import { appendGeneratedArtifactsToRunMetadata, readRunMetadata } from "../features/research-reproducibility"
import { getResearchRole } from "../features/research-workflow/roles"
import packageJson from "../../package.json" with { type: "json" }

const VERSION = packageJson.version

interface DirectoryOption {
  directory?: string
}

interface WorkspaceOption extends DirectoryOption {
  workspace: string
  resetState?: boolean
}

interface ZoteroSyncOption extends DirectoryOption {
  libraryType: ZoteroLibraryType
  libraryId: string
  apiKey?: string
  collectionKey?: string
  limit?: number
  workspace?: string
}

interface ObsidianOpenOption extends DirectoryOption {
  vault: string
  note: "manuscript" | "claims" | "evidence" | "references"
}

interface WorkspaceInitOption extends DirectoryOption {
  title: string
}

interface KnowledgeGraphQueryOption extends DirectoryOption {
  query: string
}

function loadWorkspaceFromFile(filePath: string) {
  const parsed = JSON.parse(readFileSync(filePath, "utf-8"))
  return researchWorkspaceSchema.parse(parsed)
}

function updateWorkspaceFile(
  workspacePath: string,
  updater: (workspace: ReturnType<typeof loadWorkspaceFromFile>) => Record<string, unknown>,
): void {
  if (!existsSync(workspacePath)) {
    return
  }

  const workspace = loadWorkspaceFromFile(workspacePath)
  writeFileSync(workspacePath, JSON.stringify(updater(workspace), null, 2), "utf-8")
}

function updateDerivedArtifactsMetadata(directory: string, filePaths: string[], workspacePath?: string): void {
  const resolvedWorkspacePath = workspacePath ?? `${directory}/workspace.json`
  const workspace = existsSync(resolvedWorkspacePath) ? loadWorkspaceFromFile(resolvedWorkspacePath) : null
  const runId = workspace?.runs.at(-1)?.runId ?? readRunMetadata(directory, "run-1")?.runId ?? "run-1"
  const updatedMetadata = appendGeneratedArtifactsToRunMetadata({
    directory,
    runId,
    filePaths,
  })

  const manifestPath = `${directory}/.research/export/manifest.json`
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf-8")) as Record<string, unknown>
    const nextManifest = {
      ...manifest,
      derivedArtifacts: Array.from(new Set([...(manifest.derivedArtifacts as string[] | undefined ?? []), ...filePaths.map((filePath) => filePath.replace(`${directory}/`, "./"))])),
    }
    writeFileSync(manifestPath, JSON.stringify(nextManifest, null, 2), "utf-8")
  } catch {
  }

  if (!workspace || !updatedMetadata) {
    return
  }

  writeFileSync(
    resolvedWorkspacePath,
    JSON.stringify(
      {
        ...workspace,
        runs: workspace.runs.some((run) => run.runId === updatedMetadata.runId)
          ? workspace.runs.map((run) => (run.runId === updatedMetadata.runId ? updatedMetadata : run))
          : [...workspace.runs, updatedMetadata],
      },
      null,
      2,
    ),
    "utf-8",
  )
}

function writeDerivedRoleArtifact(directory: string, roleName: "obsidian" | "knowledge-graph"): string {
  mkdirSync(`${directory}/.research/workflow`, { recursive: true })
  const outputPath = `${directory}/.research/workflow/${roleName}-role.json`
  writeFileSync(outputPath, JSON.stringify(getResearchRole(roleName), null, 2), "utf-8")
  return outputPath
}

export function createCliProgram(): Command {
  const program = new Command()

  program
    .name("oh-my-research")
    .description("Local-first research workflow runner for evidence-backed LaTeX paper development")
    .version(VERSION, "-v, --version", "Show version number")
    .enablePositionalOptions()

  program
  .command("version")
  .description("Show version information")
  .action(() => {
    console.log(`oh-my-research v${VERSION}`)
  })

  program
  .command("fixture-run")
  .description("Run the built-in local research-paper fixture workflow and emit workspace.json")
  .option("-d, --directory <path>", "Working directory", process.cwd())
  .action(async (options: DirectoryOption) => {
    const workspace = createFixtureResearchWorkspace()
    await runFixtureResearchWorkflow({
      directory: options.directory ?? process.cwd(),
      workspace,
    })
    console.log("Fixture workflow completed")
  })

  program
  .command("workspace-init")
  .description("Create a starter workspace.json for a new paper")
  .requiredOption("--title <title>", "Paper title")
  .option("-d, --directory <path>", "Working directory", process.cwd())
  .action((options: WorkspaceInitOption) => {
    mkdirSync(options.directory ?? process.cwd(), { recursive: true })
    const workspace = createStarterResearchWorkspace({
      title: options.title,
    })
    writeFileSync(
      `${options.directory ?? process.cwd()}/workspace.json`,
      JSON.stringify(workspace, null, 2),
      "utf-8",
    )
    console.log("workspace.json created")
  })

  program
  .command("workspace-run")
  .description("Run or resume the research workflow for a supplied workspace JSON file")
  .requiredOption("-w, --workspace <path>", "Workspace JSON file")
  .option("--reset-state", "Restart the workflow from ingest instead of resuming from saved state")
  .option("-d, --directory <path>", "Working directory", process.cwd())
  .action(async (options: WorkspaceOption) => {
    await runResearchWorkspaceWorkflow({
      directory: options.directory ?? process.cwd(),
      workspace: loadWorkspaceFromFile(options.workspace),
      resetState: options.resetState ?? false,
    })
    console.log("Workspace workflow completed")
  })

  program
  .command("zotero-sync")
  .description("Sync references from Zotero and emit canonical bibliography artifacts")
  .requiredOption("--library-type <users|groups>", "Zotero library type")
  .requiredOption("--library-id <id>", "Zotero library identifier")
  .option("-w, --workspace <path>", "Optional workspace JSON file to refresh after sync")
  .option("--api-key <key>", "Zotero API key")
  .option("--collection-key <key>", "Optional Zotero collection key")
  .option("--limit <count>", "Maximum items to fetch", Number.parseInt)
  .option("-d, --directory <path>", "Working directory", process.cwd())
  .action(async (options: ZoteroSyncOption) => {
    const directory = options.directory ?? process.cwd()
    const bibliography = await syncZoteroBibliography({
      directory,
      params: {
        libraryType: options.libraryType,
        libraryId: options.libraryId,
        apiKey: options.apiKey,
        collectionKey: options.collectionKey,
        limit: options.limit,
      },
    })
    updateWorkspaceFile(options.workspace ?? `${directory}/workspace.json`, (workspace) => ({
      ...workspace,
      bibliography,
    }))
    console.log(bibliography.bibPath)
  })

  program
  .command("obsidian-export")
  .description("Export a workspace JSON file to local Obsidian markdown artifacts")
  .requiredOption("-w, --workspace <path>", "Workspace JSON file")
  .option("-d, --directory <path>", "Working directory", process.cwd())
  .action((options: WorkspaceOption) => {
    const result = exportWorkspaceToObsidian({
      directory: options.directory ?? process.cwd(),
      workspace: loadWorkspaceFromFile(options.workspace),
    })
    const rolePath = writeDerivedRoleArtifact(options.directory ?? process.cwd(), "obsidian")
    updateDerivedArtifactsMetadata(options.directory ?? process.cwd(), [...result.files, rolePath], options.workspace)
    console.log(result.vaultPath)
  })

  program
  .command("obsidian-open")
  .description("Create an Obsidian open URI for one of the generated research notes")
  .requiredOption("--vault <name>", "Obsidian vault name")
  .requiredOption("--note <manuscript|claims|evidence|references>", "Generated note to open")
  .option("-d, --directory <path>", "Working directory", process.cwd())
  .action((options: ObsidianOpenOption) => {
    const notePath = `.research/derived/obsidian/${options.note}.md`
    const absoluteNotePath = `${options.directory ?? process.cwd()}/${notePath}`
    if (!existsSync(absoluteNotePath)) {
      console.error(`Error: note does not exist yet at ${notePath}`)
      process.exit(1)
    }
    console.log(createObsidianOpenUri(options.vault, notePath))
  })

  program
  .command("kg-build")
  .description("Build a local derived knowledge graph from a workspace JSON file")
  .requiredOption("-w, --workspace <path>", "Workspace JSON file")
  .option("-d, --directory <path>", "Working directory", process.cwd())
  .action((options: WorkspaceOption) => {
    const workspace = loadWorkspaceFromFile(options.workspace)
    const graph = buildKnowledgeGraph(workspace)
    const outputPath = writeKnowledgeGraph({
      directory: options.directory ?? process.cwd(),
      graph,
    })
    const rolePath = writeDerivedRoleArtifact(options.directory ?? process.cwd(), "knowledge-graph")
    updateDerivedArtifactsMetadata(options.directory ?? process.cwd(), [outputPath, rolePath], options.workspace)
    console.log(outputPath)
  })

  program
  .command("kg-query")
  .description("Query the local derived knowledge graph for matching nodes and edges")
  .requiredOption("--query <text>", "Query text")
  .option("-d, --directory <path>", "Working directory", process.cwd())
  .action((options: KnowledgeGraphQueryOption) => {
    const graphPath = `${options.directory ?? process.cwd()}/.research/derived/knowledge-graph/graph.json`
    if (!existsSync(graphPath)) {
      console.error("Error: knowledge graph does not exist yet. Run kg-build first.")
      process.exit(1)
    }

    const graph = readKnowledgeGraph(graphPath)
    const result = queryKnowledgeGraph({
      graph,
      query: options.query,
    })
    console.log(JSON.stringify(result, null, 2))
  })

  return program
}

export function runCli(): void {
  createCliProgram().parse()
}
