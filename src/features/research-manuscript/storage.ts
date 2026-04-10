import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"
import type { Claim, EvidenceItem, ManuscriptProject } from "../research-artifacts"
import { renderMainTex, renderSectionTex, type ManuscriptBibliographyBackend } from "./templates"

export function writeManuscriptProject(
  directory: string,
  project: ManuscriptProject,
  options?: {
    bibliographyBackend?: ManuscriptBibliographyBackend
    claims?: Claim[]
    evidence?: EvidenceItem[]
  },
): void {
  const mainTexPath = `${directory}/${project.mainTexPath}`
  mkdirSync(dirname(mainTexPath), { recursive: true })
  writeFileSync(mainTexPath, renderMainTex(project, options?.bibliographyBackend ?? "biber"), "utf-8")

  for (const section of project.sections) {
    const sectionPath = `${directory}/${section.latexPath}`
    mkdirSync(dirname(sectionPath), { recursive: true })

    if (!existsSync(sectionPath)) {
      writeFileSync(
        sectionPath,
        renderSectionTex({
          section,
          claims: options?.claims,
          evidence: options?.evidence,
        }),
        "utf-8",
      )
    }
  }
}
