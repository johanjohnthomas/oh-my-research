import { z } from "zod"

export const generatedArtifactSchema = z.object({
  path: z.string().min(1),
  sha256: z.string().min(1),
  generated: z.literal(true),
})

export const runMetadataSchema = z.object({
  runId: z.string().min(1),
  generatedAt: z.string().datetime(),
  workflowVersion: z.string().min(1),
  configVersion: z.string().min(1),
  promptVersion: z.string().min(1),
  toolVersions: z.record(z.string(), z.string()),
  modelVersions: z.record(z.string(), z.string()).default({}),
  sourceHashes: z.record(z.string(), z.string()),
  generatedArtifacts: z.array(generatedArtifactSchema),
})

export type GeneratedArtifact = z.infer<typeof generatedArtifactSchema>
export type RunMetadata = z.infer<typeof runMetadataSchema>
