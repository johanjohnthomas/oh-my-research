import { z } from "zod"

export const bibliographyAuthoritySchema = z.literal("zotero")

export const zoteroReferenceSchema = z.object({
  id: z.string().min(1),
  itemKey: z.string().min(1),
  citeKey: z.string().min(1),
  title: z.string().min(1),
  authors: z.array(z.string().min(1)).min(1),
  year: z.number().int().min(0).optional(),
  doi: z.string().min(1).optional(),
  url: z.string().url().optional(),
  zoteroUri: z.string().min(1),
  tags: z.array(z.string().min(1)).default([]),
})

export const bibliographyExportSchema = z.object({
  authority: bibliographyAuthoritySchema,
  generatedAt: z.string().datetime(),
  sourceHash: z.string().min(1),
  bibPath: z.string().min(1),
  references: z.array(zoteroReferenceSchema),
})

export type ZoteroReference = z.infer<typeof zoteroReferenceSchema>
export type BibliographyExport = z.infer<typeof bibliographyExportSchema>
