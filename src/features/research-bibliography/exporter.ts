import type { BibliographyExport, ZoteroReference } from "../research-artifacts"

function escapeBibtexValue(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/{/g, "\\{")
    .replace(/}/g, "\\}")
}

function renderAuthors(reference: ZoteroReference): string {
  return reference.authors.join(" and ")
}

function renderField(name: string, value: string | number | undefined): string[] {
  if (value === undefined || value === "") {
    return []
  }

  return [`  ${name} = {${escapeBibtexValue(String(value))}},`]
}

function renderReference(reference: ZoteroReference): string {
  const lines = [
    `@misc{${reference.citeKey},`,
    ...renderField("title", reference.title),
    ...renderField("author", renderAuthors(reference)),
    ...renderField("year", reference.year),
    ...renderField("doi", reference.doi),
    ...renderField("url", reference.url),
    ...renderField("note", reference.zoteroUri),
    `}`,
  ]

  return lines.join("\n")
}

export function exportBibliographyToBibtex(bibliography: BibliographyExport): string {
  return bibliography.references.map(renderReference).join("\n\n") + "\n"
}
