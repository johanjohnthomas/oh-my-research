import { z } from "zod"
import { researchWorkflowStageSchema } from "./contracts"

export const researchRoleNameSchema = z.enum([
  "ingest",
  "extract",
  "synthesize",
  "draft",
  "review",
  "export",
  "obsidian",
  "knowledge-graph",
])

export const researchRoleSchema = z.object({
  name: researchRoleNameSchema,
  category: z.string().min(1),
  summary: z.string().min(1),
})

export const researchWorkflowRoles = {
  ingest: {
    name: "ingest",
    category: "deep",
    summary: "Collect references and initialize bibliography artifacts.",
  },
  extract: {
    name: "extract",
    category: "deep",
    summary: "Extract source-backed evidence from curated references.",
  },
  synthesize: {
    name: "synthesize",
    category: "ultrabrain",
    summary: "Convert evidence into explicit manuscript claims.",
  },
  draft: {
    name: "draft",
    category: "writing",
    summary: "Draft LaTeX manuscript sections from claims and citations.",
  },
  review: {
    name: "review",
    category: "unspecified-high",
    summary: "Validate evidence, citations, and manuscript integrity.",
  },
  export: {
    name: "export",
    category: "unspecified-high",
    summary: "Emit final paper artifacts and generated outputs.",
  },
  obsidian: {
    name: "obsidian",
    category: "writing",
    summary: "Export canonical research artifacts to local vault-friendly notes.",
  },
  "knowledge-graph": {
    name: "knowledge-graph",
    category: "deep",
    summary: "Derive a local graph from canonical research artifacts.",
  },
} as const

export function getResearchRoleForStage(stage: z.infer<typeof researchWorkflowStageSchema>) {
  return researchWorkflowRoles[stage]
}

export function getResearchRole(name: ResearchRoleName) {
  return researchWorkflowRoles[name]
}

export type ResearchRole = z.infer<typeof researchRoleSchema>
export type ResearchRoleName = z.infer<typeof researchRoleNameSchema>
