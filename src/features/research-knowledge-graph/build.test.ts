/// <reference types="bun-types" />

import { afterEach, describe, expect, test } from "bun:test"
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import type { ResearchWorkspace } from "../research-artifacts"
import { buildKnowledgeGraph, queryKnowledgeGraph, readKnowledgeGraph, writeKnowledgeGraph } from "./build"

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
          tags: ["grounding"],
        },
        {
          id: "ref-2",
          itemKey: "EFGH5678",
          citeKey: "doe2024",
          title: "Replication Notes",
          authors: ["John Doe"],
          year: 2024,
          zoteroUri: "https://www.zotero.org/users/42/items/EFGH5678",
          tags: ["grounding"],
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
        tags: ["grounding"],
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
        {
          id: "claim-2",
          sectionId: "intro",
          statement: "Related supporting observation",
          kind: "descriptive",
          evidenceIds: ["evidence-1"],
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

describe("buildKnowledgeGraph", () => {
  test("builds a derived graph from canonical artifacts", () => {
    const graph = buildKnowledgeGraph(createWorkspace())

    expect(graph.nodes.some((node) => node.id === "claim-1")).toBe(true)
    expect(graph.edges.some((edge) => edge.relation === "supported-by")).toBe(true)
    expect(graph.nodes.some((node) => node.id === "theme:grounding" && node.type === "theme")).toBe(true)
    expect(graph.edges.some((edge) => edge.relation === "tagged-with" && edge.provenance === "derived")).toBe(true)
    expect(graph.edges.some((edge) => edge.relation === "related-claim" && edge.provenance === "derived")).toBe(true)
    expect(graph.edges.some((edge) => edge.relation === "mentions-reference" && edge.provenance === "derived")).toBe(true)
  })
})

describe("writeKnowledgeGraph", () => {
  test("writes graph artifacts locally", () => {
    tempDirectory = mkdtempSync(join(tmpdir(), "research-kg-"))
    const outputPath = writeKnowledgeGraph({
      directory: tempDirectory,
      graph: buildKnowledgeGraph(createWorkspace()),
    })

    expect(existsSync(outputPath)).toBe(true)
    expect(readFileSync(outputPath, "utf-8")).toContain("supported-by")
  })
})

describe("queryKnowledgeGraph", () => {
  test("returns matching nodes and connected edges for a query", () => {
    const graph = buildKnowledgeGraph(createWorkspace())
    const result = queryKnowledgeGraph({
      graph,
      query: "claim",
    })

    expect(result.nodes.some((node) => node.id === "claim-1")).toBe(true)
    expect(result.edges.some((edge) => edge.relation === "supported-by")).toBe(true)
  })

  test("returns derived theme nodes for theme queries", () => {
    const graph = buildKnowledgeGraph(createWorkspace())
    const result = queryKnowledgeGraph({
      graph,
      query: "grounding",
    })

    expect(result.nodes.some((node) => node.id === "theme:grounding")).toBe(true)
    expect(result.edges.some((edge) => edge.relation === "tagged-with" && edge.provenance === "derived")).toBe(true)
  })

  test("reads and queries a stored graph", () => {
    tempDirectory = mkdtempSync(join(tmpdir(), "research-kg-"))
    const outputPath = writeKnowledgeGraph({
      directory: tempDirectory,
      graph: buildKnowledgeGraph(createWorkspace()),
    })

    const graph = readKnowledgeGraph(outputPath)
    const result = queryKnowledgeGraph({
      graph,
      query: "Grounded Research",
    })

    expect(result.nodes.some((node) => node.id === "ref-1")).toBe(true)
  })
})
