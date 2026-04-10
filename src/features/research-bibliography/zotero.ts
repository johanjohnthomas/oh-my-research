import { computeBibliographySourceHash, writeStoredBibliographyExport } from "./storage"
import type { BibliographyExport, ZoteroReference } from "../research-artifacts"

export type ZoteroLibraryType = "users" | "groups"

export type ZoteroSyncParams = {
  libraryType: ZoteroLibraryType
  libraryId: string
  apiKey?: string
  collectionKey?: string
  limit?: number
}

type ZoteroCreator = {
  name?: string
  firstName?: string
  lastName?: string
}

type ZoteroApiItem = {
  key: string
  version?: number
  links?: {
    alternate?: {
      href?: string
    }
  }
  data: {
    key: string
    version?: number
    title?: string
    creators?: ZoteroCreator[]
    date?: string
    DOI?: string
    url?: string
    tags?: Array<{ tag?: string }>
    citationKey?: string
  }
}

function createAuthors(creators: ZoteroCreator[] | undefined): string[] {
  const authors = (creators ?? [])
    .map((creator) => {
      if (creator.name?.trim()) {
        return creator.name.trim()
      }

      const parts = [creator.firstName?.trim(), creator.lastName?.trim()].filter(Boolean)
      return parts.join(" ").trim()
    })
    .filter((author) => author.length > 0)

  return authors.length > 0 ? authors : ["Unknown Author"]
}

function parseYear(rawDate: string | undefined): number | undefined {
  const match = rawDate?.match(/\b(\d{4})\b/)
  if (!match) {
    return undefined
  }

  return Number.parseInt(match[1], 10)
}

function createReference(item: ZoteroApiItem, libraryType: ZoteroLibraryType, libraryId: string): ZoteroReference {
  const title = item.data.title?.trim() || `Untitled ${item.data.key}`
  const citeKey = item.data.citationKey?.trim() || item.data.key

  return {
    id: item.data.key,
    itemKey: item.data.key,
    citeKey,
    title,
    authors: createAuthors(item.data.creators),
    year: parseYear(item.data.date),
    doi: item.data.DOI?.trim() || undefined,
    url: item.data.url?.trim() || undefined,
    zoteroUri:
      item.links?.alternate?.href?.trim()
      || `https://www.zotero.org/${libraryType}/${libraryId}/items/${item.key}`,
    tags: (item.data.tags ?? []).flatMap((tag) => (tag.tag?.trim() ? [tag.tag.trim()] : [])),
  }
}

function createRequestUrl(params: ZoteroSyncParams): string {
  const path = `${params.libraryType}/${params.libraryId}/${params.collectionKey ? `collections/${params.collectionKey}/items` : "items"}`
  const url = new URL(`https://api.zotero.org/${path}`)
  url.searchParams.set("format", "json")
  url.searchParams.set("limit", String(params.limit ?? 100))
  return url.toString()
}

function createHeaders(apiKey?: string): Record<string, string> {
  return {
    "Zotero-API-Version": "3",
    ...(apiKey ? { "Zotero-API-Key": apiKey } : {}),
  }
}

export async function fetchZoteroReferences(
  params: ZoteroSyncParams,
  fetchImpl: typeof fetch = fetch,
): Promise<ZoteroReference[]> {
  const response = await fetchImpl(createRequestUrl(params), {
    headers: createHeaders(params.apiKey),
  })

  if (!response.ok) {
    throw new Error(`Zotero sync failed with status ${response.status}`)
  }

  const items = (await response.json()) as ZoteroApiItem[]
  return items.map((item) => createReference(item, params.libraryType, params.libraryId))
}

export async function syncZoteroBibliography(args: {
  directory: string
  params: ZoteroSyncParams
  fetchImpl?: typeof fetch
}): Promise<BibliographyExport> {
  const references = await fetchZoteroReferences(args.params, args.fetchImpl)
  const bibliography: BibliographyExport = {
    authority: "zotero",
    generatedAt: new Date().toISOString(),
    sourceHash: "",
    bibPath: researchBibPath(),
    references,
  }

  bibliography.sourceHash = computeBibliographySourceHash(bibliography)
  writeStoredBibliographyExport(args.directory, bibliography)
  return bibliography
}

function researchBibPath(): string {
  return ".research/references/generated.bib"
}
