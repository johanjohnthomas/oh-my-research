/// <reference types="bun-types" />

import { afterEach, describe, expect, mock, test } from "bun:test"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { fetchZoteroReferences, syncZoteroBibliography } from "./zotero"

let tempDirectory: string | null = null

afterEach(() => {
  if (tempDirectory) {
    rmSync(tempDirectory, { recursive: true, force: true })
    tempDirectory = null
  }
})

describe("fetchZoteroReferences", () => {
  test("maps Zotero API items to canonical references", async () => {
    const fetchImpl = mock(async () => {
      return new Response(
        JSON.stringify([
          {
            key: "ABCD1234",
            links: {
              alternate: {
                href: "https://www.zotero.org/users/42/items/ABCD1234",
              },
            },
            data: {
              key: "ABCD1234",
              title: "Grounded Research",
              creators: [{ firstName: "Jane", lastName: "Smith" }],
              date: "2024-01-15",
              DOI: "10.1000/example",
              url: "https://example.com/paper",
              citationKey: "smith2024",
              tags: [{ tag: "results" }],
            },
          },
        ]),
        { status: 200 },
      )
    })

    const references = await fetchZoteroReferences(
      {
        libraryType: "users",
        libraryId: "42",
        apiKey: "secret",
      },
      fetchImpl as unknown as typeof fetch,
    )

    expect(references).toEqual([
      {
        id: "ABCD1234",
        itemKey: "ABCD1234",
        citeKey: "smith2024",
        title: "Grounded Research",
        authors: ["Jane Smith"],
        year: 2024,
        doi: "10.1000/example",
        url: "https://example.com/paper",
        zoteroUri: "https://www.zotero.org/users/42/items/ABCD1234",
        tags: ["results"],
      },
    ])
  })

  test("uses item key when citationKey is missing", async () => {
    const fetchImpl = mock(async () => {
      return new Response(
        JSON.stringify([
          {
            key: "XYZ987",
            data: {
              key: "XYZ987",
              title: "Untitled",
              creators: [],
            },
          },
        ]),
        { status: 200 },
      )
    })

    const references = await fetchZoteroReferences(
      {
        libraryType: "users",
        libraryId: "42",
      },
      fetchImpl as unknown as typeof fetch,
    )

    expect(references[0]?.citeKey).toBe("XYZ987")
    expect(references[0]?.authors).toEqual(["Unknown Author"])
  })
})

describe("syncZoteroBibliography", () => {
  test("writes synced bibliography artifacts", async () => {
    tempDirectory = mkdtempSync(join(tmpdir(), "research-zotero-"))

    const fetchImpl = mock(async () => {
      return new Response(
        JSON.stringify([
          {
            key: "ABCD1234",
            data: {
              key: "ABCD1234",
              title: "Grounded Research",
              creators: [{ name: "Jane Smith" }],
              citationKey: "smith2024",
            },
          },
        ]),
        { status: 200 },
      )
    })

    const bibliography = await syncZoteroBibliography({
      directory: tempDirectory,
      params: {
        libraryType: "users",
        libraryId: "42",
      },
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })

    expect(bibliography.authority).toBe("zotero")
    expect(bibliography.sourceHash.length).toBeGreaterThan(0)
    expect(
      readFileSync(`${tempDirectory}/.research/references/generated.bib`, "utf-8"),
    ).toContain("@misc{smith2024,")
  })
})
