/// <reference types="bun-types" />

import { describe, expect, test } from "bun:test"
import type { ManuscriptProject } from "../research-artifacts"
import { buildManuscript, detectAvailableManuscriptBackend } from "./build"

const project: ManuscriptProject = {
  id: "paper-1",
  title: "Paper",
  mainTexPath: ".research/manuscript/main.tex",
  bibliographyPath: ".research/references/generated.bib",
  sections: [
    {
      id: "intro",
      title: "Introduction",
      latexPath: ".research/manuscript/sections/introduction.tex",
      claimIds: ["claim-1"],
      referenceCiteKeys: ["smith2024"],
    },
  ],
}

describe("buildManuscript", () => {
  test("builds latexmk command and paths", async () => {
    const result = await buildManuscript({
      directory: "/tmp/project",
      project,
      backend: "latexmk",
      execute: async (command) => ({
        exitCode: 0,
        stdout: command.join(" "),
        stderr: "",
      }),
    })

    expect(result.backend).toBe("latexmk")
    expect(result.command[0]).toBe("latexmk")
    expect(result.pdfPath).toContain("build/main.pdf")
  })

  test("builds tectonic command when requested", async () => {
    const result = await buildManuscript({
      directory: "/tmp/project",
      project,
      backend: "tectonic",
      execute: async (command) => ({
        exitCode: 0,
        stdout: command.join(" "),
        stderr: "",
      }),
    })

    expect(result.command[0]).toBe("tectonic")
  })

  test("detects an available manuscript backend or returns null", () => {
    expect(["latexmk", "tectonic", null]).toContain(detectAvailableManuscriptBackend())
  })
})
