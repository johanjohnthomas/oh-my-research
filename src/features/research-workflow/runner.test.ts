/// <reference types="bun-types" />

import { describe, expect, test } from "bun:test"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import type { ResearchWorkspace } from "../research-artifacts"
import { runResearchWorkflow } from "./runner"
import { writeWorkflowErrorArtifact, writeWorkflowState } from "./storage"
import type { ResearchWorkflowState } from "./state"

function createWorkspace(): ResearchWorkspace {
  return {
    manuscript: {
      id: "paper-1",
      title: "Paper",
      mainTexPath: ".research/manuscript/main.tex",
      bibliographyPath: ".research/references/generated.bib",
      sections: [
        {
          id: "results",
          title: "Results",
          latexPath: ".research/manuscript/sections/results.tex",
          claimIds: ["claim-1"],
          referenceCiteKeys: ["smith2024"],
        },
      ],
    },
    bibliography: {
      authority: "zotero",
      generatedAt: "2026-04-08T00:00:00.000Z",
      sourceHash: "hash-1",
      bibPath: ".research/references/generated.bib",
      references: [
        {
          id: "ref-1",
          itemKey: "ABCD1234",
          citeKey: "smith2024",
          title: "Grounded Research",
          authors: ["Jane Smith"],
          year: 2024,
          zoteroUri: "zotero://select/library/items/ABCD1234",
          tags: [],
        },
      ],
    },
    evidence: [
      {
        id: "evidence-1",
        source: {
          sourceId: "ref-1",
          locator: "p. 2",
          excerpt: "Result excerpt",
        },
        summary: "Evidence summary",
        tags: [],
        proof: {
          runId: "run-1",
          scriptPath: "scripts/eval.py",
          outputPath: ".research/runs/run-1/output.json",
          status: "passed",
        },
      },
    ],
    claims: {
      manuscriptId: "paper-1",
      claims: [
        {
          id: "claim-1",
          sectionId: "results",
          statement: "Measured improvement",
          kind: "empirical",
          evidenceIds: ["evidence-1"],
          proofId: "run-1",
        },
      ],
    },
    runs: [
      {
        runId: "run-1",
        generatedAt: "2026-04-08T00:00:00.000Z",
        toolVersions: { bun: "1.3.6" },
        modelVersions: {},
        sourceHashes: { "scripts/eval.py": "sha256-1" },
        generatedArtifacts: [
          {
            path: ".research/runs/run-1/output.json",
            sha256: "sha256-2",
            generated: true,
          },
        ],
      },
    ],
    verification: [
      {
        runId: "run-1",
        manuscriptId: "paper-1",
        generatedAt: "2026-04-08T00:00:00.000Z",
        checks: [{ name: "proof", status: "passed", detail: "ok" }],
      },
    ],
  }
}

describe("runResearchWorkflow", () => {
  test("runs all stages in order when contracts are satisfied", async () => {
    const workspace = createWorkspace()

    const result = await runResearchWorkflow({
      workspace,
      handlers: {
        ingest: async () => ({ emittedArtifacts: ["bibliography"] }),
        extract: async () => ({ emittedArtifacts: ["evidence"] }),
        synthesize: async () => ({ emittedArtifacts: ["claims"] }),
        draft: async () => ({ emittedArtifacts: ["manuscript"] }),
        review: async () => ({ emittedArtifacts: ["verification"] }),
        export: async () => ({ emittedArtifacts: ["export"] }),
      },
    })

    expect(result.completedStages).toEqual([
      "ingest",
      "extract",
      "synthesize",
      "draft",
      "review",
      "export",
    ])
  })

  test("fails when a stage does not emit its declared artifact", async () => {
    const workspace = createWorkspace()

    await expect(
      runResearchWorkflow({
        workspace,
        handlers: {
          ingest: async () => ({ emittedArtifacts: [] }),
          extract: async () => ({ emittedArtifacts: ["evidence"] }),
          synthesize: async () => ({ emittedArtifacts: ["claims"] }),
          draft: async () => ({ emittedArtifacts: ["manuscript"] }),
          review: async () => ({ emittedArtifacts: ["verification"] }),
          export: async () => ({ emittedArtifacts: ["export"] }),
        },
      }),
    ).rejects.toThrow("Stage ingest must emit artifact bibliography")
  })

  test("resumes from stored workflow state when available", async () => {
    const directory = mkdtempSync(join(tmpdir(), "research-workflow-runner-"))
    const workspace = createWorkspace()
    const executedStages: string[] = []
    const initialState: ResearchWorkflowState = {
      manuscriptId: "paper-1",
      runId: "run-1",
      currentStage: "draft",
      completedStages: ["ingest", "extract", "synthesize"],
      availableArtifacts: ["bibliography", "evidence", "claims"],
    }

    writeWorkflowState(directory, initialState)

    const result = await runResearchWorkflow({
      workspace,
      directory,
      handlers: {
        ingest: async () => {
          executedStages.push("ingest")
          return { emittedArtifacts: ["bibliography"] }
        },
        extract: async () => {
          executedStages.push("extract")
          return { emittedArtifacts: ["evidence"] }
        },
        synthesize: async () => {
          executedStages.push("synthesize")
          return { emittedArtifacts: ["claims"] }
        },
        draft: async () => {
          executedStages.push("draft")
          return { emittedArtifacts: ["manuscript"] }
        },
        review: async () => {
          executedStages.push("review")
          return { emittedArtifacts: ["verification"] }
        },
        export: async () => {
          executedStages.push("export")
          return { emittedArtifacts: ["export"] }
        },
      },
    })

    expect(executedStages).toEqual(["draft", "review", "export"])
    expect(result.completedStages).toEqual([
      "ingest",
      "extract",
      "synthesize",
      "draft",
      "review",
      "export",
    ])

    rmSync(directory, { recursive: true, force: true })
  })

  test("clears stale workflow error artifact after success", async () => {
    const directory = mkdtempSync(join(tmpdir(), "research-workflow-runner-"))
    const workspace = createWorkspace()
    const errorPath = writeWorkflowErrorArtifact({
      directory,
      stage: "draft",
      message: "stale error",
    })

    await runResearchWorkflow({
      workspace,
      directory,
      handlers: {
        ingest: async () => ({ emittedArtifacts: ["bibliography"] }),
        extract: async () => ({ emittedArtifacts: ["evidence"] }),
        synthesize: async () => ({ emittedArtifacts: ["claims"] }),
        draft: async () => ({ emittedArtifacts: ["manuscript"] }),
        review: async () => ({ emittedArtifacts: ["verification"] }),
        export: async () => ({ emittedArtifacts: ["export"] }),
      },
    })

    expect(() => readFileSync(errorPath, "utf-8")).toThrow()

    rmSync(directory, { recursive: true, force: true })
  })

  test("records running and completed lifecycle entries", async () => {
    const directory = mkdtempSync(join(tmpdir(), "research-workflow-runner-"))
    const workspace = createWorkspace()

    await runResearchWorkflow({
      workspace,
      directory,
      handlers: {
        ingest: async () => ({ emittedArtifacts: ["bibliography"], resultPath: ".research/references/generated.bib" }),
        extract: async () => ({ emittedArtifacts: ["evidence"], resultPath: ".research/evidence/evidence.json" }),
        synthesize: async () => ({ emittedArtifacts: ["claims"], resultPath: ".research/claims/claims.json" }),
        draft: async () => ({ emittedArtifacts: ["manuscript"], resultPath: ".research/manuscript/main.tex" }),
        review: async () => ({ emittedArtifacts: ["verification"], resultPath: ".research/verification/report.json" }),
        export: async () => ({ emittedArtifacts: ["export"], resultPath: ".research/export/manifest.json" }),
      },
    })

    const stageRuns = JSON.parse(readFileSync(join(directory, ".research/workflow/stage-runs.json"), "utf-8"))
    const statuses = stageRuns.map((entry: { status: string }) => entry.status)
    expect(statuses.filter((status: string) => status === "running")).toHaveLength(6)
    expect(statuses.filter((status: string) => status === "completed")).toHaveLength(6)

    rmSync(directory, { recursive: true, force: true })
  })
})
