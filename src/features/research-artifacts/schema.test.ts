/// <reference types="bun-types" />

import { describe, expect, test } from "bun:test"
import { claimSchema, researchWorkspaceSchema } from "./index"

describe("claimSchema", () => {
  test("rejects empirical claim without proof", () => {
    const result = claimSchema.safeParse({
      id: "claim-1",
      sectionId: "results",
      statement: "Accuracy improved by 12%.",
      kind: "empirical",
      evidenceIds: ["evidence-1"],
    })

    expect(result.success).toBe(false)
  })

  test("accepts descriptive claim without proof", () => {
    const result = claimSchema.safeParse({
      id: "claim-2",
      sectionId: "background",
      statement: "Transformer models are widely used in NLP.",
      kind: "descriptive",
      evidenceIds: ["evidence-2"],
    })

    expect(result.success).toBe(true)
  })
})

describe("researchWorkspaceSchema", () => {
  test("accepts valid canonical workspace", () => {
    const result = researchWorkspaceSchema.safeParse({
      manuscript: {
        id: "paper-1",
        title: "Evidence-Backed Paper",
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
            zoteroUri: "zotero://select/library/items/ABCD1234",
            tags: ["grounding"],
          },
        ],
      },
      evidence: [
        {
          id: "evidence-1",
          source: {
            sourceId: "ref-1",
            locator: "p. 4",
            excerpt: "Accuracy improved by 12%.",
          },
          summary: "Reported improvement",
          tags: ["results"],
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
            statement: "Accuracy improved by 12%.",
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
          workflowVersion: "oh-my-research@3.16.0",
          configVersion: "oh-my-research-config/v1",
          promptVersion: "research-workflow-prompt/v1",
          toolVersions: {
            bun: "1.3.6",
          },
          modelVersions: {},
          sourceHashes: {
            "scripts/eval.py": "sha256-1",
          },
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
          checks: [
            {
              name: "empirical-proof",
              status: "passed",
              detail: "All empirical claims have proof.",
            },
          ],
        },
      ],
    })

    expect(result.success).toBe(true)
  })
})
