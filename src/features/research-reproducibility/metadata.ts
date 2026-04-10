import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { relative } from "node:path"
import type { GeneratedArtifact, RunMetadata } from "../research-artifacts"

function computeFileHash(filePath: string): string {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex")
}

function normalizeArtifactPath(baseDirectory: string | undefined, filePath: string): string {
  if (!baseDirectory) {
    return filePath
  }

  const relativePath = relative(baseDirectory, filePath)
  return relativePath.startsWith(".") ? relativePath : `./${relativePath}`
}

export function collectGeneratedArtifacts(filePaths: string[], baseDirectory?: string): GeneratedArtifact[] {
  return filePaths
    .filter((filePath) => existsSync(filePath))
    .map((filePath) => ({
      path: normalizeArtifactPath(baseDirectory, filePath),
      sha256: computeFileHash(filePath),
      generated: true,
    }))
}

export function collectSourceHashes(filePaths: string[], baseDirectory?: string): Record<string, string> {
	return Object.fromEntries(
		filePaths
			.filter((filePath) => existsSync(filePath))
			.map((filePath) => [normalizeArtifactPath(baseDirectory, filePath), computeFileHash(filePath)]),
	)
}

export function readRunMetadata(directory: string, runId: string): RunMetadata | null {
  const filePath = `${directory}/.research/runs/${runId}/metadata.json`
  if (!existsSync(filePath)) {
    return null
  }

  return JSON.parse(readFileSync(filePath, "utf-8")) as RunMetadata
}

export function writeRunMetadata(args: {
  directory: string
  metadata: RunMetadata
}): string {
  const outputPath = `${args.directory}/.research/runs/${args.metadata.runId}/metadata.json`
  mkdirSync(`${args.directory}/.research/runs/${args.metadata.runId}`, { recursive: true })
  writeFileSync(outputPath, JSON.stringify(args.metadata, null, 2), "utf-8")
  return outputPath
}

export function appendGeneratedArtifactsToRunMetadata(args: {
  directory: string
  runId: string
  filePaths: string[]
}): RunMetadata | null {
  const existing = readRunMetadata(args.directory, args.runId)
  if (!existing) {
    return null
  }

  const nextArtifacts = collectGeneratedArtifacts(args.filePaths, args.directory)
  const mergedArtifacts = [...existing.generatedArtifacts]

  for (const artifact of nextArtifacts) {
    const existingIndex = mergedArtifacts.findIndex((entry) => entry.path === artifact.path)
    if (existingIndex >= 0) {
      mergedArtifacts[existingIndex] = artifact
    } else {
      mergedArtifacts.push(artifact)
    }
  }

  const nextMetadata: RunMetadata = {
    ...existing,
    generatedArtifacts: mergedArtifacts,
  }
  writeRunMetadata({ directory: args.directory, metadata: nextMetadata })
  return nextMetadata
}

export function verifyGeneratedArtifactsFromMetadata(args: {
  directory: string
  runId: string
}): { ok: boolean; issues: string[] } {
  const metadata = readRunMetadata(args.directory, args.runId)
  if (!metadata) {
    return { ok: false, issues: [`Missing run metadata for ${args.runId}`] }
  }

  const issues: string[] = []
  for (const artifact of metadata.generatedArtifacts) {
    const absolutePath = artifact.path.startsWith("./")
      ? `${args.directory}/${artifact.path.slice(2)}`
      : `${args.directory}/${artifact.path}`

    if (!existsSync(absolutePath)) {
      issues.push(`Missing generated artifact: ${artifact.path}`)
      continue
    }

    const actualHash = computeFileHash(absolutePath)
    if (actualHash !== artifact.sha256) {
      issues.push(`Generated artifact drift detected: ${artifact.path}`)
    }
  }

  return { ok: issues.length === 0, issues }
}
