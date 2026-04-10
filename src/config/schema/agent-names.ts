import { z } from "zod"

export const BuiltinAgentNameSchema = z.enum([
  "sisyphus",
  "hephaestus",
  "prometheus",
  "oracle",
  "librarian",
  "explore",
  "multimodal-looker",
  "metis",
  "momus",
  "atlas",
  "sisyphus-junior",
  "research_ingest",
  "research_bibliography",
  "research_extract",
  "research_synthesize",
  "research_draft",
  "research_verification",
  "research_review",
  "research_export",
  "research_obsidian",
  "research_knowledge_graph",
])

export const BuiltinSkillNameSchema = z.enum([
  "playwright",
  "agent-browser",
  "dev-browser",
  "frontend-ui-ux",
  "git-master",
  "review-work",
  "ai-slop-remover",
  "research_review",
  "research_cleanup",
  "research_browser_validation",
])

export const OverridableAgentNameSchema = z.enum([
  "build",
  "plan",
  "sisyphus",
  "hephaestus",
  "sisyphus-junior",
  "OpenCode-Builder",
  "prometheus",
  "metis",
  "momus",
  "oracle",
  "librarian",
  "explore",
  "multimodal-looker",
  "atlas",
  "research_ingest",
  "research_bibliography",
  "research_extract",
  "research_synthesize",
  "research_draft",
  "research_verification",
  "research_review",
  "research_export",
  "research_obsidian",
  "research_knowledge_graph",
])

export const AgentNameSchema = BuiltinAgentNameSchema
export type AgentName = z.infer<typeof AgentNameSchema>

export type BuiltinSkillName = z.infer<typeof BuiltinSkillNameSchema>
