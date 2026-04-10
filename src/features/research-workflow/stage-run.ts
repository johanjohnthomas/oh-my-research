import { z } from "zod"
import { researchWorkflowStageSchema } from "./contracts"

export const workflowStageRunStatusSchema = z.enum([
  "pending",
  "running",
  "completed",
  "error",
  "cancelled",
])

export const workflowStageRunSchema = z.object({
  id: z.string().min(1),
  manuscriptId: z.string().min(1),
  runId: z.string().min(1),
  stage: researchWorkflowStageSchema,
  status: workflowStageRunStatusSchema,
  queuedAt: z.string().datetime(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  resultPath: z.string().min(1).optional(),
  error: z.string().min(1).optional(),
})

export type WorkflowStageRun = z.infer<typeof workflowStageRunSchema>
export type WorkflowStageRunStatus = z.infer<typeof workflowStageRunStatusSchema>
