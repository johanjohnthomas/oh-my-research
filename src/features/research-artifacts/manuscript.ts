import { z } from "zod"

export const manuscriptSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  latexPath: z.string().min(1),
  claimIds: z.array(z.string().min(1)).default([]),
  referenceCiteKeys: z.array(z.string().min(1)).default([]),
})

export const manuscriptProjectSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  mainTexPath: z.string().min(1),
  bibliographyPath: z.string().min(1),
  sections: z.array(manuscriptSectionSchema).min(1),
})

export type ManuscriptSection = z.infer<typeof manuscriptSectionSchema>
export type ManuscriptProject = z.infer<typeof manuscriptProjectSchema>
