import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { researchWorkflowStateSchema, type ResearchWorkflowState } from "./state"
import { workflowStageRunSchema, type WorkflowStageRun } from "./stage-run"

const workflowStateDir = ".research/workflow"
const workflowStateFile = "state.json"
const workflowRunsFile = "stage-runs.json"
const workflowErrorFile = "error.json"

function getWorkflowDirectory(directory: string): string {
  return join(directory, workflowStateDir)
}

function getWorkflowStatePath(directory: string): string {
  return join(getWorkflowDirectory(directory), workflowStateFile)
}

function getWorkflowRunsPath(directory: string): string {
  return join(getWorkflowDirectory(directory), workflowRunsFile)
}

function getWorkflowErrorPath(directory: string): string {
  return join(getWorkflowDirectory(directory), workflowErrorFile)
}

export function readWorkflowState(directory: string): ResearchWorkflowState | null {
  const statePath = getWorkflowStatePath(directory)
  if (!existsSync(statePath)) {
    return null
  }

  try {
    const parsed = JSON.parse(readFileSync(statePath, "utf-8"))
    const result = researchWorkflowStateSchema.safeParse(parsed)
    return result.success ? result.data : null
  } catch {
    return null
  }
}

export function writeWorkflowState(directory: string, state: ResearchWorkflowState): void {
  mkdirSync(getWorkflowDirectory(directory), { recursive: true })
  writeFileSync(getWorkflowStatePath(directory), JSON.stringify(state, null, 2), "utf-8")
}

export function readWorkflowStageRuns(directory: string): WorkflowStageRun[] {
  const runsPath = getWorkflowRunsPath(directory)
  if (!existsSync(runsPath)) {
    return []
  }

  try {
    const parsed = JSON.parse(readFileSync(runsPath, "utf-8"))
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.flatMap((item) => {
      const result = workflowStageRunSchema.safeParse(item)
      return result.success ? [result.data] : []
    })
  } catch {
    return []
  }
}

export function appendWorkflowStageRun(directory: string, stageRun: WorkflowStageRun): void {
  const stageRuns = readWorkflowStageRuns(directory)
  mkdirSync(getWorkflowDirectory(directory), { recursive: true })
  writeFileSync(
    getWorkflowRunsPath(directory),
    JSON.stringify([...stageRuns, stageRun], null, 2),
    "utf-8",
  )
}

export function writeWorkflowErrorArtifact(args: {
  directory: string
  stage?: string
  message: string
}): string {
  mkdirSync(getWorkflowDirectory(args.directory), { recursive: true })
  const outputPath = getWorkflowErrorPath(args.directory)
  writeFileSync(
    outputPath,
    JSON.stringify(
      {
        stage: args.stage,
        message: args.message,
      },
      null,
      2,
    ),
    "utf-8",
  )
  return outputPath
}

export function clearWorkflowErrorArtifact(directory: string): void {
  const outputPath = getWorkflowErrorPath(directory)
  if (existsSync(outputPath)) {
    rmSync(outputPath, { force: true })
  }
}
