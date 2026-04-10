/// <reference types="bun-types" />

import { afterEach, describe, expect, test } from "bun:test"
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { readStoredBibliographyExport, writeStoredBibliographyExport } from "./storage"

let tempDirectory: string | null = null

afterEach(() => {
  if (tempDirectory) {
    rmSync(tempDirectory, { recursive: true, force: true })
    tempDirectory = null
  }
})

describe("bibliography storage", () => {
  test("writes JSON and BibTeX outputs", () => {
    tempDirectory = mkdtempSync(join(tmpdir(), "research-bibliography-"))

    writeStoredBibliographyExport(tempDirectory, {
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
    })

    expect(readStoredBibliographyExport(tempDirectory)?.authority).toBe("zotero")
    expect(existsSync(`${tempDirectory}/.research/references/generated.bib`)).toBe(true)
    expect(readFileSync(`${tempDirectory}/.research/references/generated.bib`, "utf-8")).toContain("@misc{smith2024,")
  })
})
