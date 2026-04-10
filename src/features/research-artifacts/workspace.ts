import { z } from "zod"
import { bibliographyExportSchema } from "./bibliography"
import { claimLedgerSchema } from "./claims"
import { evidenceItemSchema } from "./evidence"
import { manuscriptProjectSchema } from "./manuscript"
import { runMetadataSchema } from "./run-metadata"
import { verificationReportSchema } from "./verification"

export const researchWorkspaceSchema = z.object({
  manuscript: manuscriptProjectSchema,
  bibliography: bibliographyExportSchema,
  evidence: z.array(evidenceItemSchema),
  claims: claimLedgerSchema,
  runs: z.array(runMetadataSchema).default([]),
  verification: z.array(verificationReportSchema).default([]),
})

export type ResearchWorkspace = z.infer<typeof researchWorkspaceSchema>
