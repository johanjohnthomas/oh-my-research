import { existsSync, readFileSync } from "node:fs"
import {
  validateResearchWorkspaceRelationships,
  verificationReportSchema,
  type ResearchWorkspace,
  type VerificationCheck,
  type VerificationReport,
} from "../research-artifacts"
import { isStoredBibliographyFresh } from "../research-bibliography"
import { verifyGeneratedArtifactsFromMetadata } from "../research-reproducibility"

function createCheck(name: string, status: "passed" | "failed", detail: string): VerificationCheck {
  return { name, status, detail }
}

function verifyEmpiricalClaims(workspace: ResearchWorkspace): VerificationCheck {
  const unsupportedClaims = workspace.claims.claims.filter((claim) => {
    if (claim.kind !== "empirical") {
      return false
    }

    if (!claim.proofId) {
      return true
    }

    const supportingEvidence = workspace.evidence.filter((evidence) => claim.evidenceIds.includes(evidence.id))
    return supportingEvidence.every((evidence) => evidence.proof?.runId !== claim.proofId)
  })

  if (unsupportedClaims.length > 0) {
    return createCheck(
      "empirical-proof",
      "failed",
      `Unsupported empirical claims: ${unsupportedClaims.map((claim) => claim.id).join(", ")}`,
    )
  }

  return createCheck("empirical-proof", "passed", "All empirical claims have supporting proof.")
}

function verifyWorkspaceRelationships(workspace: ResearchWorkspace): VerificationCheck {
  const result = validateResearchWorkspaceRelationships(workspace)
  if (!result.success) {
    return createCheck("artifact-relationships", "failed", result.issues.join(" | "))
  }

  return createCheck("artifact-relationships", "passed", "All artifact relationships are valid.")
}

function verifyBibliography(directory: string): VerificationCheck {
  return isStoredBibliographyFresh(directory)
    ? createCheck("bibliography-freshness", "passed", "Generated bibliography matches canonical export.")
    : createCheck("bibliography-freshness", "failed", "Generated bibliography is stale or edited.")
}

function verifyCompileStatus(directory: string): VerificationCheck {
  const buildResultPath = `${directory}/.research/manuscript/build-result.json`
  if (!existsSync(buildResultPath)) {
    return createCheck("compile-status", "failed", "Manuscript build result is missing.")
  }

  try {
    const buildResult = JSON.parse(readFileSync(buildResultPath, "utf-8")) as {
      exitCode?: number
      pdfPath?: string
      logPath?: string
      stderr?: string
    }
    if (buildResult.exitCode !== 0) {
      return createCheck("compile-status", "failed", "Manuscript compile exited with a non-zero status.")
    }

    if (!buildResult.pdfPath || !existsSync(buildResult.pdfPath)) {
      return createCheck("compile-status", "failed", "Compiled PDF artifact is missing.")
    }

    if (!buildResult.logPath || !existsSync(buildResult.logPath)) {
      return createCheck("compile-status", "failed", "Compile log artifact is missing.")
    }

    const logText = readFileSync(buildResult.logPath, "utf-8")
    const combined = `${buildResult.stderr ?? ""}\n${logText}`
    return createCheck("compile-status", "passed", "Manuscript compile status is successful.")
  } catch {
    return createCheck("compile-status", "failed", "Manuscript build result could not be parsed.")
  }
}

function verifyCitationStatus(directory: string): VerificationCheck {
  const buildResultPath = `${directory}/.research/manuscript/build-result.json`
  if (!existsSync(buildResultPath)) {
    return createCheck("citation-status", "failed", "Manuscript build result is missing.")
  }

  try {
    const buildResult = JSON.parse(readFileSync(buildResultPath, "utf-8")) as { logPath?: string; stderr?: string }
    const logText = buildResult.logPath && existsSync(buildResult.logPath)
      ? readFileSync(buildResult.logPath, "utf-8")
      : ""
    const combined = `${buildResult.stderr ?? ""}\n${logText}`
    const hasCitationProblems = /undefined citations|citation.*undefined|please \(re\)run biber|please \(re\)run bibtex/i.test(combined)

    return hasCitationProblems
      ? createCheck("citation-status", "failed", "Build output indicates unresolved citations or bibliography processing warnings.")
      : createCheck("citation-status", "passed", "No unresolved citation warnings detected in build output.")
  } catch {
    return createCheck("citation-status", "failed", "Manuscript build result could not be parsed.")
  }
}

function verifyGeneratedArtifactDrift(directory: string, workspace: ResearchWorkspace): VerificationCheck {
  const runId = workspace.runs.at(-1)?.runId ?? "run-missing"
  const result = verifyGeneratedArtifactsFromMetadata({ directory, runId })

  return result.ok
    ? createCheck("generated-artifact-drift", "passed", "Generated artifacts match recorded hashes.")
    : createCheck("generated-artifact-drift", "failed", result.issues.join(" | "))
}

export function createVerificationReport(args: {
  directory: string
  workspace: ResearchWorkspace
}): VerificationReport {
  const checks = [
    verifyWorkspaceRelationships(args.workspace),
    verifyEmpiricalClaims(args.workspace),
    verifyBibliography(args.directory),
    verifyCompileStatus(args.directory),
    verifyCitationStatus(args.directory),
    verifyGeneratedArtifactDrift(args.directory, args.workspace),
  ]

  return verificationReportSchema.parse({
    runId: args.workspace.runs.at(-1)?.runId ?? "run-missing",
    manuscriptId: args.workspace.manuscript.id,
    generatedAt: new Date().toISOString(),
    checks,
  })
}

export function createHumanReadableVerificationReport(report: VerificationReport): string {
  return [
    `# Verification Report`,
    ``,
    `- Run ID: ${report.runId}`,
    `- Manuscript ID: ${report.manuscriptId}`,
    `- Generated At: ${report.generatedAt}`,
    ``,
    ...report.checks.map((check) => `- ${check.name}: ${check.status} — ${check.detail}`),
    ``,
  ].join("\n")
}
