import { z } from "zod"

export const verificationCheckSchema = z.object({
  name: z.string().min(1),
  status: z.enum(["passed", "failed"]),
  detail: z.string().min(1),
})

export const verificationReportSchema = z.object({
  runId: z.string().min(1),
  manuscriptId: z.string().min(1),
  generatedAt: z.string().datetime(),
  checks: z.array(verificationCheckSchema).min(1),
})

export type VerificationCheck = z.infer<typeof verificationCheckSchema>
export type VerificationReport = z.infer<typeof verificationReportSchema>
