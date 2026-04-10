import type { ResearchWorkspace } from "../research-artifacts"
import { validateResearchWorkspaceRelationships } from "../research-artifacts"
import {
  workflowStageContracts,
  type ResearchWorkflowStage,
  type WorkflowArtifactKey,
} from "./contracts"
import {
  advanceResearchWorkflowState,
  createInitialResearchWorkflowState,
  type ResearchWorkflowState,
} from "./state"
import {
  appendWorkflowStageRun,
  clearWorkflowErrorArtifact,
  readWorkflowState,
  writeWorkflowState,
  writeWorkflowErrorArtifact,
} from "./storage"

export type ResearchWorkflowStageResult = {
  emittedArtifacts: WorkflowArtifactKey[]
  resultPath?: string
}

export type ResearchWorkflowStageHandler = (args: {
  workspace: ResearchWorkspace
  state: ResearchWorkflowState
}) => Promise<ResearchWorkflowStageResult>

function createStageRunId(stage: ResearchWorkflowStage, status: string): string {
  return `${stage}-${status}-${Date.now()}`
}

export async function runResearchWorkflow(args: {
  workspace: ResearchWorkspace
  handlers: Record<ResearchWorkflowStage, ResearchWorkflowStageHandler>
  directory?: string
  initialState?: ResearchWorkflowState
}): Promise<ResearchWorkflowState> {
  const relationshipValidation = validateResearchWorkspaceRelationships(args.workspace)
  if (!relationshipValidation.success) {
    if (args.directory) {
      writeWorkflowErrorArtifact({
        directory: args.directory,
        message: relationshipValidation.issues.join("\n"),
      })
    }
    throw new Error(relationshipValidation.issues.join("\n"))
  }

  let state =
    args.initialState
    ?? (args.directory ? readWorkflowState(args.directory) : null)
    ?? createInitialResearchWorkflowState(
      args.workspace.manuscript.id,
      args.workspace.runs.at(-1)?.runId ?? "run-missing",
    )

  const orderedStages: ResearchWorkflowStage[] = [
    "ingest",
    "extract",
    "synthesize",
    "draft",
    "review",
    "export",
  ]

  const startIndex = Math.max(orderedStages.indexOf(state.currentStage), 0)
  const stagesToRun = orderedStages.filter(
    (stage, index) => index >= startIndex && !state.completedStages.includes(stage),
  )

  for (const stage of stagesToRun) {
    try {
      const contract = workflowStageContracts[stage]
      if (args.directory) {
        appendWorkflowStageRun(args.directory, {
          id: createStageRunId(stage, "running"),
          manuscriptId: state.manuscriptId,
          runId: state.runId,
          stage,
          status: "running",
          queuedAt: new Date().toISOString(),
          startedAt: new Date().toISOString(),
        })
      }
      for (const requiredArtifact of contract.requires) {
        if (!state.availableArtifacts.includes(requiredArtifact)) {
          const message = `Stage ${stage} requires missing artifact ${requiredArtifact}`
          if (args.directory) {
            writeWorkflowErrorArtifact({
              directory: args.directory,
              stage,
              message,
            })
          }
          throw new Error(message)
        }
      }

      const result = await args.handlers[stage]({
        workspace: args.workspace,
        state,
      })

      for (const emittedArtifact of contract.emits) {
        if (!result.emittedArtifacts.includes(emittedArtifact)) {
          const message = `Stage ${stage} must emit artifact ${emittedArtifact}`
          if (args.directory) {
            writeWorkflowErrorArtifact({
              directory: args.directory,
              stage,
              message,
            })
          }
          throw new Error(message)
        }
      }

      state = advanceResearchWorkflowState(state, stage)
      if (args.directory) {
        writeWorkflowState(args.directory, state)
        appendWorkflowStageRun(args.directory, {
          id: createStageRunId(stage, "completed"),
          manuscriptId: state.manuscriptId,
          runId: state.runId,
          stage,
          status: "completed",
          queuedAt: new Date().toISOString(),
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          resultPath: result.resultPath,
        })
      }
    } catch (error) {
      if (args.directory) {
        writeWorkflowErrorArtifact({
          directory: args.directory,
          stage,
          message: error instanceof Error ? error.message : String(error),
        })
        writeWorkflowState(args.directory, state)
        appendWorkflowStageRun(args.directory, {
          id: createStageRunId(stage, "error"),
          manuscriptId: state.manuscriptId,
          runId: state.runId,
          stage,
          status: "error",
          queuedAt: new Date().toISOString(),
          startedAt: new Date().toISOString(),
          error: error instanceof Error ? error.message : String(error),
        })
      }
      throw error
    }
  }

  if (args.directory) {
    clearWorkflowErrorArtifact(args.directory)
  }

  return state
}
