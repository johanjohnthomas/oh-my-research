import { z } from "zod"

export const researchWorkflowStageSchema = z.enum([
  "ingest",
  "extract",
  "synthesize",
  "draft",
  "review",
  "export",
])

export const workflowArtifactKeySchema = z.enum([
  "bibliography",
  "evidence",
  "claims",
  "manuscript",
  "verification",
  "export",
])

export const workflowStageContractSchema = z.object({
  stage: researchWorkflowStageSchema,
  requires: z.array(workflowArtifactKeySchema),
  emits: z.array(workflowArtifactKeySchema),
})

export const workflowStageContracts = {
  ingest: {
    stage: "ingest",
    requires: [],
    emits: ["bibliography"],
  },
  extract: {
    stage: "extract",
    requires: ["bibliography"],
    emits: ["evidence"],
  },
  synthesize: {
    stage: "synthesize",
    requires: ["evidence"],
    emits: ["claims"],
  },
  draft: {
    stage: "draft",
    requires: ["claims", "bibliography"],
    emits: ["manuscript"],
  },
  review: {
    stage: "review",
    requires: ["manuscript", "claims", "evidence"],
    emits: ["verification"],
  },
  export: {
    stage: "export",
    requires: ["manuscript", "bibliography", "verification"],
    emits: ["export"],
  },
} satisfies Record<string, z.infer<typeof workflowStageContractSchema>>

export type ResearchWorkflowStage = z.infer<typeof researchWorkflowStageSchema>
export type WorkflowArtifactKey = z.infer<typeof workflowArtifactKeySchema>
export type WorkflowStageContract = z.infer<typeof workflowStageContractSchema>
