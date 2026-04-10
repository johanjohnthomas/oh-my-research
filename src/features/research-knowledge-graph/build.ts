import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import type { ResearchWorkspace } from "../research-artifacts"

export type KnowledgeGraphNode = {
  id: string
  type: "manuscript" | "section" | "claim" | "evidence" | "reference" | "theme"
  label: string
}

export type KnowledgeGraphEdge = {
  from: string
  to: string
  relation: string
  provenance: "extracted" | "derived"
}

export type KnowledgeGraph = {
  nodes: KnowledgeGraphNode[]
  edges: KnowledgeGraphEdge[]
}

export type KnowledgeGraphQueryResult = {
  nodes: KnowledgeGraphNode[]
  edges: KnowledgeGraphEdge[]
}

export function buildKnowledgeGraph(workspace: ResearchWorkspace): KnowledgeGraph {
  const themeTags = Array.from(new Set([
    ...workspace.evidence.flatMap((item) => item.tags),
    ...workspace.bibliography.references.flatMap((reference) => reference.tags),
  ])).filter((tag) => tag.trim().length > 0)

  const nodes: KnowledgeGraphNode[] = [
    {
      id: workspace.manuscript.id,
      type: "manuscript",
      label: workspace.manuscript.title,
    },
    ...workspace.manuscript.sections.map((section) => ({
      id: section.id,
      type: "section" as const,
      label: section.title,
    })),
    ...workspace.claims.claims.map((claim) => ({
      id: claim.id,
      type: "claim" as const,
      label: claim.statement,
    })),
    ...workspace.evidence.map((evidence) => ({
      id: evidence.id,
      type: "evidence" as const,
      label: evidence.summary,
    })),
    ...workspace.bibliography.references.map((reference) => ({
      id: reference.id,
      type: "reference" as const,
      label: reference.title,
    })),
    ...themeTags.map((tag) => ({
      id: `theme:${tag}`,
      type: "theme" as const,
      label: tag,
    })),
  ]

  const edges: KnowledgeGraphEdge[] = [
    ...workspace.manuscript.sections.map((section) => ({
      from: workspace.manuscript.id,
      to: section.id,
      relation: "has-section",
      provenance: "extracted" as const,
    })),
    ...workspace.claims.claims.map((claim) => ({
      from: claim.sectionId,
      to: claim.id,
      relation: "states",
      provenance: "extracted" as const,
    })),
    ...workspace.claims.claims.flatMap((claim) =>
      claim.evidenceIds.map((evidenceId) => ({
        from: claim.id,
        to: evidenceId,
        relation: "supported-by",
        provenance: "extracted" as const,
      })),
    ),
    ...workspace.evidence.map((evidence) => ({
      from: evidence.id,
      to: evidence.source.sourceId,
      relation: "cites",
      provenance: "extracted" as const,
    })),
    ...workspace.evidence.flatMap((evidence) =>
      evidence.tags.map((tag) => ({
        from: evidence.id,
        to: `theme:${tag}`,
        relation: "tagged-with",
        provenance: "derived" as const,
      })),
    ),
    ...workspace.bibliography.references.flatMap((reference) =>
      reference.tags.map((tag) => ({
        from: reference.id,
        to: `theme:${tag}`,
        relation: "tagged-with",
        provenance: "derived" as const,
      })),
    ),
    ...workspace.claims.claims.flatMap((claim, index, claims) =>
      claims
        .slice(index + 1)
        .filter((other) => other.evidenceIds.some((evidenceId) => claim.evidenceIds.includes(evidenceId)))
        .map((other) => ({
          from: claim.id,
          to: other.id,
          relation: "related-claim",
          provenance: "derived" as const,
        })),
    ),
    ...workspace.manuscript.sections.flatMap((section) =>
      section.referenceCiteKeys.flatMap((citeKey) => {
        const matchingReferences = workspace.bibliography.references.filter((reference) => reference.citeKey === citeKey)
        return matchingReferences.map((reference) => ({
          from: section.id,
          to: reference.id,
          relation: "mentions-reference",
          provenance: "derived" as const,
        }))
      }),
    ),
  ]

  return { nodes, edges }
}

export function writeKnowledgeGraph(args: {
  directory: string
  graph: KnowledgeGraph
}): string {
  const outputPath = `${args.directory}/.research/derived/knowledge-graph/graph.json`
  mkdirSync(`${args.directory}/.research/derived/knowledge-graph`, { recursive: true })
  writeFileSync(outputPath, JSON.stringify(args.graph, null, 2), "utf-8")
  return outputPath
}

export function readKnowledgeGraph(graphPath: string): KnowledgeGraph {
  return JSON.parse(readFileSync(graphPath, "utf-8")) as KnowledgeGraph
}

export function queryKnowledgeGraph(args: {
  graph: KnowledgeGraph
  query: string
}): KnowledgeGraphQueryResult {
  const normalizedQuery = args.query.trim().toLowerCase()
  const matchedNodes = args.graph.nodes.filter((node) => {
    return (
      node.id.toLowerCase().includes(normalizedQuery)
      || node.label.toLowerCase().includes(normalizedQuery)
      || node.type.toLowerCase().includes(normalizedQuery)
    )
  })
  const matchedNodeIds = new Set(matchedNodes.map((node) => node.id))
  const matchedEdges = args.graph.edges.filter((edge) => {
    return (
      edge.relation.toLowerCase().includes(normalizedQuery)
      || matchedNodeIds.has(edge.from)
      || matchedNodeIds.has(edge.to)
    )
  })

  return {
    nodes: matchedNodes,
    edges: matchedEdges,
  }
}
