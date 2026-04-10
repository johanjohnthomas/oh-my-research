import type { ResearchWorkspace } from "./workspace"

export type ResearchWorkspaceValidationResult = {
  success: boolean
  issues: string[]
}

export function validateResearchWorkspaceRelationships(
  workspace: ResearchWorkspace,
): ResearchWorkspaceValidationResult {
  const issues: string[] = []
  const sectionIds = new Set(workspace.manuscript.sections.map((section) => section.id))
  const claimIds = new Set(workspace.claims.claims.map((claim) => claim.id))
  const evidenceIds = new Set(workspace.evidence.map((evidence) => evidence.id))
  const runIds = new Set(workspace.runs.map((run) => run.runId))
  const referenceIds = new Set(workspace.bibliography.references.map((reference) => reference.id))
  const citeKeys = new Set(workspace.bibliography.references.map((reference) => reference.citeKey))

  for (const section of workspace.manuscript.sections) {
    for (const claimId of section.claimIds) {
      if (!claimIds.has(claimId)) {
        issues.push(`Section ${section.id} references unknown claim ${claimId}`)
      }
    }

    for (const citeKey of section.referenceCiteKeys) {
      if (!citeKeys.has(citeKey)) {
        issues.push(`Section ${section.id} references unknown cite key ${citeKey}`)
      }
    }
  }

  for (const evidence of workspace.evidence) {
    if (!referenceIds.has(evidence.source.sourceId)) {
      issues.push(`Evidence ${evidence.id} references unknown source ${evidence.source.sourceId}`)
    }

    if (evidence.proof && !runIds.has(evidence.proof.runId)) {
      issues.push(`Evidence ${evidence.id} references unknown run ${evidence.proof.runId}`)
    }
  }

  for (const claim of workspace.claims.claims) {
    if (!sectionIds.has(claim.sectionId)) {
      issues.push(`Claim ${claim.id} references unknown section ${claim.sectionId}`)
    }

    for (const evidenceId of claim.evidenceIds) {
      if (!evidenceIds.has(evidenceId)) {
        issues.push(`Claim ${claim.id} references unknown evidence ${evidenceId}`)
      }
    }

    if (claim.kind === "empirical" && claim.proofId && !runIds.has(claim.proofId)) {
      issues.push(`Empirical claim ${claim.id} references unknown proof run ${claim.proofId}`)
    }
  }

  return {
    success: issues.length === 0,
    issues,
  }
}
