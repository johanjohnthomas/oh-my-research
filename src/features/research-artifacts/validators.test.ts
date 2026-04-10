/// <reference types="bun-types" />

import { describe, expect, test } from "bun:test"
import type { ResearchWorkspace } from "./workspace"
import { validateResearchWorkspaceRelationships } from "./validators"

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
    verification: [],
  }
}

describe("validateResearchWorkspaceRelationships", () => {
  test("accepts a consistent workspace", () => {
    const result = validateResearchWorkspaceRelationships(createWorkspace())

    expect(result.success).toBe(true)
    expect(result.issues).toEqual([])
  })

  test("rejects broken cross-artifact references", () => {
    const workspace = createWorkspace()
    workspace.claims.claims[0]!.evidenceIds = ["missing-evidence"]
    workspace.claims.claims[0]!.proofId = "missing-run"
    workspace.manuscript.sections[0]!.referenceCiteKeys = ["missing-cite-key"]

    const result = validateResearchWorkspaceRelationships(workspace)

    expect(result.success).toBe(false)
    expect(result.issues).toEqual([
      "Section results references unknown cite key missing-cite-key",
      "Claim claim-1 references unknown evidence missing-evidence",
      "Empirical claim claim-1 references unknown proof run missing-run",
    ])
  })
})
