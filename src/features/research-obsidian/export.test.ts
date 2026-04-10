/// <reference types="bun-types" />

import { afterEach, describe, expect, test } from "bun:test"
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import type { ResearchWorkspace } from "../research-artifacts"
import { createObsidianOpenUri, exportWorkspaceToObsidian } from "./export"

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

describe("exportWorkspaceToObsidian", () => {
  test("writes vault-friendly markdown files", () => {
    tempDirectory = mkdtempSync(join(tmpdir(), "research-obsidian-"))
    const result = exportWorkspaceToObsidian({
      directory: tempDirectory,
      workspace: createWorkspace(),
    })

    expect(result.files).toHaveLength(4)
    expect(existsSync(`${tempDirectory}/.research/derived/obsidian/claims.md`)).toBe(true)
    expect(readFileSync(`${tempDirectory}/.research/derived/obsidian/references.md`, "utf-8")).toContain("smith2024")
  })
})

describe("createObsidianOpenUri", () => {
  test("creates an obsidian open URI", () => {
    expect(createObsidianOpenUri("ResearchVault", "claims.md")).toBe(
      "obsidian://open?vault=ResearchVault&file=claims.md",
    )
  })
})
