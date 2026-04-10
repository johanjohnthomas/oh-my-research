/// <reference types="bun-types" />

import { afterEach, describe, expect, test } from "bun:test"
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import type { ResearchWorkspace } from "../research-artifacts"
import { writeStoredBibliographyExport } from "../research-bibliography"
import { writeBuildResult } from "../research-manuscript"
import { collectGeneratedArtifacts, writeRunMetadata } from "../research-reproducibility"
import { createVerificationReport } from "./verify"

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
    verification: [],
  }
}

describe("createVerificationReport", () => {
  test("passes when bibliography and empirical claims are valid", () => {
    tempDirectory = mkdtempSync(join(tmpdir(), "research-verification-"))
    const workspace = createWorkspace()

    writeStoredBibliographyExport(tempDirectory, {
      ...workspace.bibliography,
      sourceHash: "",
    })
    const stored = JSON.parse(
      readFileSync(`${tempDirectory}/.research/references/zotero-export.json`, "utf-8"),
    ) as typeof workspace.bibliography
    workspace.bibliography = stored
    writeBuildResult({
      directory: tempDirectory,
      result: {
        backend: "latexmk",
        command: ["latexmk", "main.tex"],
        exitCode: 0,
        pdfPath: `${tempDirectory}/.research/manuscript/build/main.pdf`,
        logPath: `${tempDirectory}/.research/manuscript/build/main.log`,
        stdout: "ok",
        stderr: "",
      },
    })
    mkdirSync(`${tempDirectory}/.research/manuscript/build`, { recursive: true })
    writeFileSync(`${tempDirectory}/.research/manuscript/build/main.pdf`, "%PDF-1.4\n", "utf-8")
    writeFileSync(`${tempDirectory}/.research/manuscript/build/main.log`, "compile ok\n", "utf-8")
    writeRunMetadata({
      directory: tempDirectory,
      metadata: {
        runId: "run-1",
        generatedAt: "2026-04-08T00:00:00.000Z",
        workflowVersion: "oh-my-research@3.16.0",
        configVersion: "oh-my-research-config/v1",
        toolVersions: { bun: "1.3.6" },
        modelVersions: {},
        sourceHashes: { "scripts/eval.py": "sha256-1" },
        generatedArtifacts: collectGeneratedArtifacts([
          `${tempDirectory}/.research/references/generated.bib`,
        ], tempDirectory),
      },
    })

    const report = createVerificationReport({
      directory: tempDirectory,
      workspace,
    })

    expect(report.checks.map((check) => check.status)).toEqual(["passed", "passed", "passed", "passed", "passed", "passed"])
  })

  test("fails on edited bibliography and unsupported empirical claim", () => {
    tempDirectory = mkdtempSync(join(tmpdir(), "research-verification-"))
    const workspace = createWorkspace()
    workspace.claims.claims[0]!.proofId = "missing-run"

    writeStoredBibliographyExport(tempDirectory, {
      ...workspace.bibliography,
      sourceHash: "",
    })
    const jsonPath = `${tempDirectory}/.research/references/zotero-export.json`
    const stored = JSON.parse(readFileSync(jsonPath, "utf-8")) as typeof workspace.bibliography
    workspace.bibliography = stored
    writeFileSync(`${tempDirectory}/.research/references/generated.bib`, "edited", "utf-8")
    writeBuildResult({
      directory: tempDirectory,
      result: {
        backend: "latexmk",
        command: ["latexmk", "main.tex"],
        exitCode: 1,
        pdfPath: `${tempDirectory}/.research/manuscript/build/main.pdf`,
        logPath: `${tempDirectory}/.research/manuscript/build/main.log`,
        stdout: "",
        stderr: "compile failed\nundefined citations",
      },
    })
    mkdirSync(`${tempDirectory}/.research/manuscript/build`, { recursive: true })
    writeFileSync(`${tempDirectory}/.research/manuscript/build/main.log`, "please (re)run bibtex\n", "utf-8")
    writeRunMetadata({
      directory: tempDirectory,
      metadata: {
        runId: "run-1",
        generatedAt: "2026-04-08T00:00:00.000Z",
        workflowVersion: "oh-my-research@3.16.0",
        configVersion: "oh-my-research-config/v1",
        toolVersions: { bun: "1.3.6" },
        modelVersions: {},
        sourceHashes: { "scripts/eval.py": "sha256-1" },
        generatedArtifacts: [
          {
            path: "./.research/references/generated.bib",
            sha256: "mismatch",
            generated: true,
          },
        ],
      },
    })

    const report = createVerificationReport({
      directory: tempDirectory,
      workspace,
    })

    expect(report.checks.map((check) => check.status)).toEqual(["failed", "failed", "failed", "failed", "failed", "failed"])
  })
})
