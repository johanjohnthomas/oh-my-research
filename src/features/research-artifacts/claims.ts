import { z } from "zod"

export const claimKindSchema = z.enum(["descriptive", "empirical"])

export const claimSchema = z.object({
  id: z.string().min(1),
  sectionId: z.string().min(1),
  statement: z.string().min(1),
  kind: claimKindSchema,
  evidenceIds: z.array(z.string().min(1)).min(1),
  proofId: z.string().min(1).optional(),
}).superRefine((claim, ctx) => {
  if (claim.kind === "empirical" && !claim.proofId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Empirical claims require proofId",
      path: ["proofId"],
    })
  }
})

export const claimLedgerSchema = z.object({
  manuscriptId: z.string().min(1),
  claims: z.array(claimSchema),
})

export type Claim = z.infer<typeof claimSchema>
export type ClaimLedger = z.infer<typeof claimLedgerSchema>
