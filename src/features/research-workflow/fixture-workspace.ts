import type { ResearchWorkspace } from "../research-artifacts"

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "paper"
}

export function createStarterResearchWorkspace(args: {
  title: string
  runId?: string
}): ResearchWorkspace {
  const manuscriptId = slugify(args.title)
  const runId = args.runId ?? `${manuscriptId}-run-1`

  return {
    manuscript: {
      id: manuscriptId,
      title: args.title,
      mainTexPath: ".research/manuscript/main.tex",
      bibliographyPath: ".research/references/generated.bib",
      sections: [
        {
          id: "introduction",
          title: "Introduction",
          latexPath: ".research/manuscript/sections/introduction.tex",
          claimIds: [],
          referenceCiteKeys: [],
        },
      ],
    },
    bibliography: {
      authority: "zotero",
      generatedAt: new Date().toISOString(),
      sourceHash: "starter-workspace",
      bibPath: ".research/references/generated.bib",
      references: [],
    },
    evidence: [],
    claims: {
      manuscriptId,
      claims: [],
    },
    runs: [
      {
        runId,
        generatedAt: new Date().toISOString(),
        workflowVersion: "oh-my-research@3.16.0",
        configVersion: "oh-my-research-config/v1",
        promptVersion: "research-workflow-prompt/v1",
        toolVersions: { bun: Bun.version },
        modelVersions: {},
        sourceHashes: {},
        generatedArtifacts: [],
      },
    ],
    verification: [],
  }
}

export function createFixtureResearchWorkspace(): ResearchWorkspace {
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
        workflowVersion: "oh-my-research@3.16.0",
        configVersion: "oh-my-research-config/v1",
        promptVersion: "research-workflow-prompt/v1",
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
