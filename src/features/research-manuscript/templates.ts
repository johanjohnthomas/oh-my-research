import { basename } from "node:path/posix"
import type { Claim, EvidenceItem, ManuscriptProject, ManuscriptSection } from "../research-artifacts"

export type ManuscriptBibliographyBackend = "biber" | "bibtex"

function renderSectionInput(section: ManuscriptSection): string {
  const normalizedPath = section.latexPath.replace(/^\.research\/manuscript\//, "")
  return `\\input{${normalizedPath.replace(/\.tex$/, "")}}`
}

function renderBibliographyFilename(project: ManuscriptProject): string {
  return basename(project.bibliographyPath)
}

export function renderMainTex(project: ManuscriptProject, bibliographyBackend: ManuscriptBibliographyBackend): string {
  return [
    "\\documentclass{article}",
    `\\usepackage[backend=${bibliographyBackend}]{biblatex}`,
    `\\addbibresource{${renderBibliographyFilename(project)}}`,
    `\\title{${project.title}}`,
    "\\begin{document}",
    "\\maketitle",
    ...project.sections.map(renderSectionInput),
    "\\printbibliography",
    "\\end{document}",
    "",
  ].join("\n")
}

export function renderSectionTex(args: {
  section: ManuscriptSection
  claims?: Claim[]
  evidence?: EvidenceItem[]
}): string {
  const { section, claims = [], evidence = [] } = args
  const citationLine = section.referenceCiteKeys.length > 0
    ? `This section is grounded in ${section.referenceCiteKeys.map((citeKey) => `\\cite{${citeKey}}`).join(", ")}.`
    : "This section is grounded in canonical research artifacts."

  const relatedClaims = claims.filter((claim) => section.claimIds.includes(claim.id))
  const relatedEvidence = evidence.filter((item) =>
    relatedClaims.some((claim) => claim.evidenceIds.includes(item.id)),
  )

  const claimLines = relatedClaims.length > 0
    ? [
        "\\subsection*{Claims}",
        ...relatedClaims.map((claim) => `- ${claim.statement}`),
      ]
    : []

  const evidenceLines = relatedEvidence.length > 0
    ? [
        "\\subsection*{Evidence}",
        ...relatedEvidence.map((item) => `- ${item.summary} (${item.source.locator})`),
      ]
    : []

  return [
    `\\section{${section.title}}`,
    `% claims: ${section.claimIds.join(", ")}`,
    citationLine,
    ...claimLines,
    ...evidenceLines,
    "",
  ].join("\n")
}
