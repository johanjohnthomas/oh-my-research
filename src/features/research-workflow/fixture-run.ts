import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { researchArtifactPaths } from "../research-artifacts"
import type { ResearchWorkspace } from "../research-artifacts"
import { writeStoredBibliographyExport } from "../research-bibliography"
import {
  buildManuscript,
  detectAvailableBibliographyBackend,
  detectAvailableManuscriptBackend,
  writeBuildResult,
  writeManuscriptProject,
} from "../research-manuscript"
import { createHumanReadableVerificationReport, createVerificationReport } from "../research-verification"
import { collectGeneratedArtifacts, collectSourceHashes, writeRunMetadata } from "../research-reproducibility"
import { runResearchWorkflow } from "./runner"
import { getResearchRoleForStage } from "./roles"
import { createInitialResearchWorkflowState } from "./state"
import { writeWorkflowState } from "./storage"

export async function runResearchWorkspaceWorkflow(args: {
  directory: string
  workspace: ResearchWorkspace
  resetState?: boolean
}): Promise<void> {
  const runId = args.workspace.runs.at(-1)?.runId ?? "run-missing"
  mkdirSync(`${args.directory}/${researchArtifactPaths.verification}`, { recursive: true })
  mkdirSync(`${args.directory}/${researchArtifactPaths.export}`, { recursive: true })
  let finalReport: ReturnType<typeof createVerificationReport> | null = null

  function writeStageRole(stage: "ingest" | "extract" | "synthesize" | "draft" | "review" | "export") {
    writeFileSync(
      `${args.directory}/.research/workflow/${stage}-role.json`,
      JSON.stringify(getResearchRoleForStage(stage), null, 2),
      "utf-8",
    )
  }

  function getGeneratedArtifactPaths(): string[] {
    const corePaths = [
      `${args.directory}/.research/references/generated.bib`,
      `${args.directory}/.research/references/zotero-export.json`,
      `${args.directory}/.research/evidence/evidence.json`,
      `${args.directory}/.research/claims/claims.json`,
      `${args.directory}/.research/manuscript/main.tex`,
      `${args.directory}/.research/manuscript/build-result.json`,
      `${args.directory}/.research/manuscript/build/main.pdf`,
      `${args.directory}/.research/manuscript/build/main.log`,
      `${args.directory}/.research/runs/${runId}/output.json`,
      `${args.directory}/.research/verification/report.json`,
      `${args.directory}/.research/verification/report.md`,
      `${args.directory}/.research/export/manifest.json`,
      `${args.directory}/.research/workflow/state.json`,
      `${args.directory}/.research/workflow/stage-runs.json`,
      `${args.directory}/.research/workflow/ingest-role.json`,
      `${args.directory}/.research/workflow/extract-role.json`,
      `${args.directory}/.research/workflow/synthesize-role.json`,
      `${args.directory}/.research/workflow/draft-role.json`,
      `${args.directory}/.research/workflow/review-role.json`,
      `${args.directory}/.research/workflow/export-role.json`,
    ]

    return [...corePaths, ...getExistingDerivedArtifactPaths()]
  }

  function getExistingDerivedArtifactPaths(): string[] {
	const candidatePaths = [
		`${args.directory}/${researchArtifactPaths.obsidian}/manuscript.md`,
		`${args.directory}/${researchArtifactPaths.obsidian}/claims.md`,
		`${args.directory}/${researchArtifactPaths.obsidian}/evidence.md`,
		`${args.directory}/${researchArtifactPaths.obsidian}/references.md`,
		`${args.directory}/${researchArtifactPaths.knowledgeGraph}/graph.json`,
		`${args.directory}/.research/workflow/obsidian-role.json`,
		`${args.directory}/.research/workflow/knowledge-graph-role.json`,
	]

	return candidatePaths.filter((filePath) => existsSync(filePath))
  }

  function getExistingDerivedArtifactEntries(): string[] {
	const manifestPath = `${args.directory}/${researchArtifactPaths.export}/manifest.json`
	if (!existsSync(manifestPath)) {
		return []
	}

	try {
		const manifest = JSON.parse(readFileSync(manifestPath, "utf-8")) as { derivedArtifacts?: string[] }
		return manifest.derivedArtifacts ?? []
	} catch {
		return []
	}
  }

  function getSourceArtifactPaths(): string[] {
	return [
		`${args.directory}/.research/references/zotero-export.json`,
		`${args.directory}/.research/evidence/evidence.json`,
		`${args.directory}/.research/claims/claims.json`,
		`${args.directory}/.research/manuscript/main.tex`,
		...args.workspace.manuscript.sections.map((section) => `${args.directory}/${section.latexPath}`),
	]
  }

  function buildUpdatedRuns() {
    const existingRuns = args.workspace.runs.filter((run) => run.runId !== runId)
    return [
      ...existingRuns,
      {
        ...args.workspace.runs.at(-1)!,
        sourceHashes: collectSourceHashes(getSourceArtifactPaths(), args.directory),
        generatedArtifacts: collectGeneratedArtifacts(getGeneratedArtifactPaths(), args.directory),
      },
    ]
  }

  function buildUpdatedVerification() {
    const existingVerification = args.workspace.verification.filter((report) => report.runId !== runId)
    if (!finalReport) {
      return args.workspace.verification
    }

    return [...existingVerification, finalReport]
  }

  function buildUpdatedWorkspace(): ResearchWorkspace {
    return {
      ...args.workspace,
      runs: buildUpdatedRuns(),
      verification: buildUpdatedVerification(),
    }
  }

  function hasFailedChecks(report: ReturnType<typeof createVerificationReport>): boolean {
    return report.checks.some((check) => check.status === "failed")
  }

  const finalState = await runResearchWorkflow({
    workspace: args.workspace,
    directory: args.directory,
    initialState: args.resetState
      ? createInitialResearchWorkflowState(args.workspace.manuscript.id, runId)
      : undefined,
    handlers: {
      ingest: async ({ workspace }) => {
        writeStoredBibliographyExport(args.directory, workspace.bibliography)
        mkdirSync(`${args.directory}/.research/workflow`, { recursive: true })
        writeStageRole("ingest")
        return { emittedArtifacts: ["bibliography"], resultPath: ".research/references/generated.bib" }
      },
      extract: async ({ workspace }) => {
        mkdirSync(`${args.directory}/.research/evidence`, { recursive: true })
        mkdirSync(`${args.directory}/.research/runs/${runId}`, { recursive: true })
        writeFileSync(
          `${args.directory}/.research/evidence/evidence.json`,
          JSON.stringify(workspace.evidence, null, 2),
          "utf-8",
        )
        writeFileSync(
          `${args.directory}/.research/runs/${runId}/output.json`,
          JSON.stringify({ status: "passed", evidenceIds: workspace.evidence.map((item) => item.id) }, null, 2),
          "utf-8",
        )
        writeStageRole("extract")
        return { emittedArtifacts: ["evidence"], resultPath: ".research/evidence/evidence.json" }
      },
      synthesize: async ({ workspace }) => {
        mkdirSync(`${args.directory}/.research/claims`, { recursive: true })
        writeFileSync(
          `${args.directory}/.research/claims/claims.json`,
          JSON.stringify(workspace.claims, null, 2),
          "utf-8",
        )
        writeStageRole("synthesize")
        return { emittedArtifacts: ["claims"], resultPath: ".research/claims/claims.json" }
      },
      draft: async ({ workspace }) => {
        writeManuscriptProject(args.directory, workspace.manuscript, {
          bibliographyBackend: detectAvailableBibliographyBackend(),
          claims: workspace.claims.claims,
          evidence: workspace.evidence,
        })
        writeStageRole("draft")
        return { emittedArtifacts: ["manuscript"], resultPath: workspace.manuscript.mainTexPath }
      },
      review: async ({ workspace }) => {
        const buildResult = await buildManuscript({
          directory: args.directory,
          project: workspace.manuscript,
          backend: detectAvailableManuscriptBackend() ?? undefined,
        })
        writeBuildResult({ directory: args.directory, result: buildResult })

        writeRunMetadata({
          directory: args.directory,
          metadata: {
            ...args.workspace.runs.at(-1)!,
            generatedArtifacts: collectGeneratedArtifacts(getGeneratedArtifactPaths(), args.directory),
          },
        })

        const report = createVerificationReport({
          directory: args.directory,
          workspace,
        })
        finalReport = report
        writeFileSync(
          `${args.directory}/.research/verification/report.json`,
          JSON.stringify(report, null, 2),
          "utf-8",
        )
        writeFileSync(
          `${args.directory}/.research/verification/report.md`,
          createHumanReadableVerificationReport(report),
          "utf-8",
        )
        if (hasFailedChecks(report)) {
          throw new Error(`Verification failed: ${report.checks.filter((check) => check.status === "failed").map((check) => check.name).join(", ")}`)
        }
        writeStageRole("review")
        return { emittedArtifacts: ["verification"], resultPath: ".research/verification/report.json" }
      },
      export: async ({ workspace }) => {
        const derivedArtifacts = Array.from(
          new Set([
            ...getExistingDerivedArtifactEntries(),
            ...getExistingDerivedArtifactPaths().map((filePath) => filePath.replace(`${args.directory}/`, "./")),
          ]),
        )
        writeFileSync(
          `${args.directory}/.research/export/manifest.json`,
          JSON.stringify({
            manuscript: workspace.manuscript.mainTexPath,
            bibliography: workspace.bibliography.bibPath,
            verification: ".research/verification/report.json",
            buildResult: ".research/manuscript/build-result.json",
            pdf: ".research/manuscript/build/main.pdf",
            log: ".research/manuscript/build/main.log",
            derivedArtifacts,
          }, null, 2),
          "utf-8",
        )
        writeStageRole("export")
        return { emittedArtifacts: ["export"], resultPath: ".research/export/manifest.json" }
      },
    },
  })

  writeWorkflowState(args.directory, finalState)

  writeRunMetadata({
    directory: args.directory,
    metadata: {
      ...args.workspace.runs.at(-1)!,
      sourceHashes: collectSourceHashes(getSourceArtifactPaths(), args.directory),
      generatedArtifacts: collectGeneratedArtifacts(getGeneratedArtifactPaths(), args.directory),
    },
  })

  finalReport = createVerificationReport({
    directory: args.directory,
    workspace: buildUpdatedWorkspace(),
  })
  writeFileSync(
    `${args.directory}/.research/verification/report.json`,
    JSON.stringify(finalReport, null, 2),
    "utf-8",
  )
  writeFileSync(
    `${args.directory}/.research/verification/report.md`,
    createHumanReadableVerificationReport(finalReport),
    "utf-8",
  )

  writeFileSync(
    `${args.directory}/workspace.json`,
    JSON.stringify(buildUpdatedWorkspace(), null, 2),
    "utf-8",
  )
}

export async function runFixtureResearchWorkflow(args: {
  directory: string
  workspace: ResearchWorkspace
}): Promise<void> {
  return runResearchWorkspaceWorkflow({ ...args, resetState: true })
}
