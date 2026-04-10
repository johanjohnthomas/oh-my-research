/// <reference types="bun-types" />

import { describe, expect, test } from "bun:test"
import { exportBibliographyToBibtex } from "./exporter"

describe("exportBibliographyToBibtex", () => {
  test("renders deterministic BibTeX output", () => {
    const output = exportBibliographyToBibtex({
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
          authors: ["Jane Smith", "John Doe"],
          year: 2024,
          doi: "10.1000/example",
          url: "https://example.com/paper",
          zoteroUri: "zotero://select/library/items/ABCD1234",
          tags: [],
        },
      ],
    })

    expect(output).toContain("@misc{smith2024,")
    expect(output).toContain("author = {Jane Smith and John Doe},")
    expect(output).toContain("doi = {10.1000/example},")
  })
})
