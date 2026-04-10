/// <reference types="bun-types" />

import { afterEach, describe, expect, test } from "bun:test"
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import type { Claim, EvidenceItem, ManuscriptProject } from "../research-artifacts"
import { writeManuscriptProject } from "./storage"
import { writeBuildResult } from "./build"

let tempDirectory: string | null = null

afterEach(() => {
  if (tempDirectory) {
    rmSync(tempDirectory, { recursive: true, force: true })
    tempDirectory = null
  }
})

describe("writeManuscriptProject", () => {
  test("writes main tex and section files", () => {
    tempDirectory = mkdtempSync(join(tmpdir(), "research-manuscript-"))

    const project: ManuscriptProject = {
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
    }

    writeManuscriptProject(tempDirectory, project, { bibliographyBackend: "bibtex" })

    expect(existsSync(`${tempDirectory}/.research/manuscript/main.tex`)).toBe(true)
    expect(existsSync(`${tempDirectory}/.research/manuscript/sections/introduction.tex`)).toBe(true)
    expect(readFileSync(`${tempDirectory}/.research/manuscript/main.tex`, "utf-8")).toContain("\\printbibliography")
    expect(readFileSync(`${tempDirectory}/.research/manuscript/main.tex`, "utf-8")).toContain("\\usepackage[backend=bibtex]{biblatex}")
    expect(readFileSync(`${tempDirectory}/.research/manuscript/main.tex`, "utf-8")).toContain("\\addbibresource{generated.bib}")
    expect(readFileSync(`${tempDirectory}/.research/manuscript/sections/introduction.tex`, "utf-8")).toContain("\\cite{smith2024}")
  })

  test("writes build result metadata", () => {
    tempDirectory = mkdtempSync(join(tmpdir(), "research-manuscript-"))

    const outputPath = writeBuildResult({
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

    expect(existsSync(outputPath)).toBe(true)
    expect(readFileSync(outputPath, "utf-8")).toContain('"exitCode": 0')
  })

  test("writes section content from claims and evidence", () => {
    tempDirectory = mkdtempSync(join(tmpdir(), "research-manuscript-"))

    const project: ManuscriptProject = {
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
    }
    const claims: Claim[] = [
      {
        id: "claim-1",
        sectionId: "intro",
        statement: "Measured improvement",
        kind: "empirical",
        evidenceIds: ["evidence-1"],
        proofId: "run-1",
      },
    ]
    const evidence: EvidenceItem[] = [
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
    ]

    writeManuscriptProject(tempDirectory, project, {
      bibliographyBackend: "bibtex",
      claims,
      evidence,
    })

    const sectionText = readFileSync(`${tempDirectory}/.research/manuscript/sections/introduction.tex`, "utf-8")
    expect(sectionText).toContain("Measured improvement")
    expect(sectionText).toContain("Evidence summary (p. 2)")
  })
})
