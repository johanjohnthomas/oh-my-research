import { z } from "zod"
import {
  researchWorkflowStageSchema,
  workflowArtifactKeySchema,
  workflowStageContracts,
  type ResearchWorkflowStage,
  type WorkflowArtifactKey,
} from "./contracts"

export const researchWorkflowStateSchema = z.object({
  manuscriptId: z.string().min(1),
  runId: z.string().min(1),
  currentStage: researchWorkflowStageSchema,
  completedStages: z.array(researchWorkflowStageSchema),
  availableArtifacts: z.array(workflowArtifactKeySchema),
})

export type ResearchWorkflowState = z.infer<typeof researchWorkflowStateSchema>

export function createInitialResearchWorkflowState(
  manuscriptId: string,
  runId: string,
): ResearchWorkflowState {
  return {
    manuscriptId,
    runId,
    currentStage: "ingest",
    completedStages: [],
    availableArtifacts: [],
  }
}

export function advanceResearchWorkflowState(
  state: ResearchWorkflowState,
  stage: ResearchWorkflowStage,
): ResearchWorkflowState {
  const contract = workflowStageContracts[stage]
  const completedStages = state.completedStages.includes(stage)
    ? state.completedStages
    : [...state.completedStages, stage]
  const availableArtifacts = Array.from(
    new Set<WorkflowArtifactKey>([...state.availableArtifacts, ...contract.emits]),
  )
  const nextStage = getNextStage(stage)

  return {
    ...state,
    currentStage: nextStage,
    completedStages,
    availableArtifacts,
  }
}

function getNextStage(stage: ResearchWorkflowStage): ResearchWorkflowStage {
  const orderedStages: ResearchWorkflowStage[] = [
    "ingest",
    "extract",
    "synthesize",
    "draft",
    "review",
    "export",
  ]
  const index = orderedStages.indexOf(stage)
  return orderedStages[Math.min(index + 1, orderedStages.length - 1)] ?? "export"
}
