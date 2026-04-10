import { mkdirSync, writeFileSync } from "node:fs"
import type { ResearchWorkspace } from "../research-artifacts"

function renderClaimNote(workspace: ResearchWorkspace): string {
  return workspace.claims.claims
    .map((claim) => `- ${claim.id}: ${claim.statement}`)
    .join("\n")
}

function renderEvidenceNote(workspace: ResearchWorkspace): string {
  return workspace.evidence
    .map((evidence) => `- ${evidence.id}: ${evidence.summary} (${evidence.source.locator})`)
    .join("\n")
}

function renderReferenceNote(workspace: ResearchWorkspace): string {
  return workspace.bibliography.references
    .map((reference) => `- ${reference.citeKey}: ${reference.title}`)
    .join("\n")
}

export function exportWorkspaceToObsidian(args: {
  directory: string
  workspace: ResearchWorkspace
}): { vaultPath: string; files: string[] } {
  const vaultPath = `${args.directory}/.research/derived/obsidian`
  mkdirSync(vaultPath, { recursive: true })

  const files = [
    {
      path: `${vaultPath}/manuscript.md`,
      content: `# ${args.workspace.manuscript.title}\n\n- Main TeX: ${args.workspace.manuscript.mainTexPath}`,
    },
    {
      path: `${vaultPath}/claims.md`,
      content: `# Claims\n\n${renderClaimNote(args.workspace)}\n`,
    },
    {
      path: `${vaultPath}/evidence.md`,
      content: `# Evidence\n\n${renderEvidenceNote(args.workspace)}\n`,
    },
    {
      path: `${vaultPath}/references.md`,
      content: `# References\n\n${renderReferenceNote(args.workspace)}\n`,
    },
  ]

  for (const file of files) {
    writeFileSync(file.path, file.content, "utf-8")
  }

  return {
    vaultPath,
    files: files.map((file) => file.path),
  }
}

export function createObsidianOpenUri(vaultName: string, filePath: string): string {
  return `obsidian://open?vault=${encodeURIComponent(vaultName)}&file=${encodeURIComponent(filePath)}`
}
