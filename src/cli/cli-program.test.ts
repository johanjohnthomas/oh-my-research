import { describe, expect, test } from "bun:test"

import { createCliProgram } from "./cli-program"

describe("createCliProgram", () => {
  test("exposes research-first commands without transitional run command", () => {
    const help = createCliProgram().helpInformation()

    expect(help).toContain("workspace-init")
    expect(help).toContain("fixture-run")
    expect(help).toContain("workspace-run")
    expect(help).toContain("zotero-sync")
    expect(help).toContain("obsidian-export")
    expect(help).toContain("obsidian-open")
    expect(help).toContain("kg-build")
    expect(help).toContain("kg-query")
    expect(help).not.toContain("run [options] <message>")
    expect(help).not.toContain("Transitional host/runtime session entrypoint")
  })
})
