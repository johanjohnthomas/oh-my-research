import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"
import {
  bibliographyExportSchema,
  researchArtifactPaths,
  type BibliographyExport,
} from "../research-artifacts"
import { exportBibliographyToBibtex } from "./exporter"

function resolveBibliographyJsonPath(directory: string): string {
  return `${directory}/${researchArtifactPaths.references}/zotero-export.json`
}

function resolveBibliographyBibPath(directory: string): string {
  return `${directory}/${researchArtifactPaths.bibliography}`
}

export function computeBibliographySourceHash(bibliography: BibliographyExport): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        authority: bibliography.authority,
        references: bibliography.references,
      }),
    )
    .digest("hex")
}

export function readStoredBibliographyExport(directory: string): BibliographyExport | null {
  const filePath = resolveBibliographyJsonPath(directory)
  if (!existsSync(filePath)) {
    return null
  }

  try {
    const parsed = JSON.parse(readFileSync(filePath, "utf-8"))
    const result = bibliographyExportSchema.safeParse(parsed)
    return result.success ? result.data : null
  } catch {
    return null
  }
}

export function writeStoredBibliographyExport(
  directory: string,
  bibliography: BibliographyExport,
): void {
  const normalizedBibliography: BibliographyExport = {
    ...bibliography,
    sourceHash: computeBibliographySourceHash(bibliography),
  }
  const jsonPath = resolveBibliographyJsonPath(directory)
  const bibPath = resolveBibliographyBibPath(directory)
  mkdirSync(dirname(jsonPath), { recursive: true })
  writeFileSync(jsonPath, JSON.stringify(normalizedBibliography, null, 2), "utf-8")
  writeFileSync(bibPath, exportBibliographyToBibtex(normalizedBibliography), "utf-8")
}

export function isStoredBibliographyFresh(directory: string): boolean {
  const bibliography = readStoredBibliographyExport(directory)
  if (!bibliography) {
    return false
  }

  const bibPath = resolveBibliographyBibPath(directory)
  if (!existsSync(bibPath)) {
    return false
  }

  const expectedBibtex = exportBibliographyToBibtex(bibliography)
  const storedBibtex = readFileSync(bibPath, "utf-8")

  return bibliography.sourceHash === computeBibliographySourceHash(bibliography)
    && storedBibtex === expectedBibtex
}
