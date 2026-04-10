import { z } from "zod"

export const sourceAnchorSchema = z.object({
  sourceId: z.string().min(1),
  locator: z.string().min(1),
  excerpt: z.string().min(1),
})

export const executableProofSchema = z.object({
  runId: z.string().min(1),
  scriptPath: z.string().min(1),
  outputPath: z.string().min(1),
  status: z.enum(["passed", "failed"]),
})

export const evidenceItemSchema = z.object({
  id: z.string().min(1),
  source: sourceAnchorSchema,
  summary: z.string().min(1),
  tags: z.array(z.string().min(1)).default([]),
  proof: executableProofSchema.optional(),
})

export type SourceAnchor = z.infer<typeof sourceAnchorSchema>
export type ExecutableProof = z.infer<typeof executableProofSchema>
export type EvidenceItem = z.infer<typeof evidenceItemSchema>
