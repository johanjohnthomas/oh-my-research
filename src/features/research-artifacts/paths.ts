export const researchArtifactPaths = {
  root: ".research",
  manuscript: ".research/manuscript",
  references: ".research/references",
  evidence: ".research/evidence",
  claims: ".research/claims",
  runs: ".research/runs",
  verification: ".research/verification",
  export: ".research/export",
  derived: ".research/derived",
  obsidian: ".research/derived/obsidian",
  knowledgeGraph: ".research/derived/knowledge-graph",
  bibliography: ".research/references/generated.bib",
} as const

export type ResearchArtifactPathKey = keyof typeof researchArtifactPaths
