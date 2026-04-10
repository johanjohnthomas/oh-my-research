/// <reference types="bun-types" />

import { afterEach, describe, expect, test } from "bun:test"
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import type { ResearchWorkspace } from "../research-artifacts"
import { runFixtureResearchWorkflow } from "./fixture-run"

let tempDirectory: string | null = null

afterEach(() => {
  if (tempDirectory) {
    rmSync(tempDirectory, { recursive: true, force: true })
    tempDirectory = null
  }
})

function createWorkspace(): ResearchWorkspace {
  return {
    manuscript: {
      id: "paper-1",
      title: "Paper",
      mainTexPath: ".research/manuscript/main.tex",
      bibliographyPath: ".research/references/generated.bib",
      sections: [
        {
          id: "intro",
          title: "Introduction",
          latexPath: ".research/manuscript/sections/introduction.tex",
          claimIds: ["claim-1"],
          referenceCiteKeys: ["smith2024"],
        },
      ],
    },
    bibliography: {
      authority: "zotero",
      generatedAt: "2026-04-08T00:00:00.000Z",
      sourceHash: "placeholder",
      bibPath: ".research/references/generated.bib",
      references: [
        {
          id: "ref-1",
          itemKey: "ABCD1234",
          citeKey: "smith2024",
          title: "Grounded Research",
          authors: ["Jane Smith"],
          year: 2024,
          zoteroUri: "https://www.zotero.org/users/42/items/ABCD1234",
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
          sectionId: "intro",
          statement: "Measured improvement",
          kind: "empirical",
          evidenceIds: ["evidence-1"],
          proofId: "run-1",
        },
      ],
    },
    runs: [
      {
        runId: "run-0",
        generatedAt: "2026-04-07T00:00:00.000Z",
        toolVersions: { bun: "1.3.5" },
        modelVersions: {},
        sourceHashes: { "scripts/old.py": "sha256-old" },
        generatedArtifacts: [
          {
            path: ".research/runs/run-0/output.json",
            sha256: "sha256-old-output",
            generated: true,
          },
        ],
      },
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
    verification: [],
  }
}

describe("runFixtureResearchWorkflow", () => {
  test("writes the core local paper workflow artifacts", async () => {
    tempDirectory = mkdtempSync(join(tmpdir(), "research-fixture-run-"))

    await runFixtureResearchWorkflow({
      directory: tempDirectory,
      workspace: createWorkspace(),
    })

    expect(existsSync(`${tempDirectory}/workspace.json`)).toBe(true)
    expect(existsSync(`${tempDirectory}/.research/references/generated.bib`)).toBe(true)
    expect(existsSync(`${tempDirectory}/.research/references/zotero-export.json`)).toBe(true)
    expect(existsSync(`${tempDirectory}/.research/evidence/evidence.json`)).toBe(true)
    expect(existsSync(`${tempDirectory}/.research/claims/claims.json`)).toBe(true)
    expect(existsSync(`${tempDirectory}/.research/manuscript/main.tex`)).toBe(true)
    expect(existsSync(`${tempDirectory}/.research/manuscript/build-result.json`)).toBe(true)
    expect(existsSync(`${tempDirectory}/.research/manuscript/build/main.pdf`)).toBe(true)
    expect(existsSync(`${tempDirectory}/.research/manuscript/build/main.log`)).toBe(true)
    expect(existsSync(`${tempDirectory}/.research/verification/report.json`)).toBe(true)
    expect(existsSync(`${tempDirectory}/.research/export/manifest.json`)).toBe(true)
    expect(existsSync(`${tempDirectory}/.research/runs/run-1/output.json`)).toBe(true)
    expect(existsSync(`${tempDirectory}/.research/runs/run-1/metadata.json`)).toBe(true)
    expect(readFileSync(`${tempDirectory}/.research/workflow/state.json`, "utf-8")).toContain("completedStages")
    const stageRuns = JSON.parse(readFileSync(`${tempDirectory}/.research/workflow/stage-runs.json`, "utf-8"))
    expect(stageRuns.filter((stageRun: { status: string }) => stageRun.status === "running")).toHaveLength(6)
    expect(stageRuns.filter((stageRun: { status: string }) => stageRun.status === "completed")).toHaveLength(6)
    expect(
      stageRuns
        .filter((stageRun: { status: string }) => stageRun.status === "completed")
        .map((stageRun: { stage: string }) => stageRun.stage),
    ).toEqual([
      "ingest",
      "extract",
      "synthesize",
      "draft",
      "review",
      "export",
    ])
    for (const stage of ["ingest", "extract", "synthesize", "draft", "review", "export"]) {
      expect(existsSync(`${tempDirectory}/.research/workflow/${stage}-role.json`)).toBe(true)
    }
    const report = JSON.parse(readFileSync(`${tempDirectory}/.research/verification/report.json`, "utf-8"))
    expect(report.checks.map((check: { status: string }) => check.status)).toEqual([
      "passed",
      "passed",
      "passed",
      "passed",
      "passed",
      "passed",
    ])
    const manifest = JSON.parse(readFileSync(`${tempDirectory}/.research/export/manifest.json`, "utf-8"))
    expect(Object.keys(manifest).sort()).toEqual([
      "bibliography",
      "buildResult",
      "derivedArtifacts",
      "log",
      "manuscript",
      "pdf",
      "verification",
    ])
    const metadata = JSON.parse(readFileSync(`${tempDirectory}/.research/runs/run-1/metadata.json`, "utf-8"))
    expect(metadata.generatedArtifacts.some((artifact: { path: string }) => artifact.path.endsWith(".research/runs/run-1/output.json"))).toBe(true)
    expect(metadata.generatedArtifacts.some((artifact: { path: string }) => artifact.path.endsWith(".research/workflow/stage-runs.json"))).toBe(true)
    const workspace = JSON.parse(readFileSync(`${tempDirectory}/workspace.json`, "utf-8"))
    expect(workspace.runs).toHaveLength(2)
    expect(workspace.runs[0].runId).toBe("run-0")
    expect(workspace.runs[1].runId).toBe("run-1")
    expect(workspace.verification).toHaveLength(1)
  }, { timeout: 15000 })
})
