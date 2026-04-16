/// <reference path="../../../bun-test.d.ts" />

import { describe, expect, it, mock } from "bun:test"

import { findOpenCodeBinaryWithVersion, getOpenCodeBinaryCandidates } from "./opencode-binary"

function createProc(exitCode: number, output: string) {
  return {
    stdout: new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(output))
        controller.close()
      },
    }),
    exited: Promise.resolve(exitCode),
    exitCode,
  }
}

describe("getOpenCodeBinaryCandidates", () => {
  it("returns defaults when no env override is provided", () => {
    expect(getOpenCodeBinaryCandidates(undefined)).toEqual(["opencode", "opencode-desktop"])
  })

  it("parses and deduplicates custom candidates", () => {
    expect(getOpenCodeBinaryCandidates("oc, opencode , oc")).toEqual(["oc", "opencode"])
  })
})

describe("findOpenCodeBinaryWithVersion", () => {
  it("maps custom CLI aliases to the CLI config type", async () => {
    const spawn = mock((_command: string[], _options: object) => createProc(0, "1.2.3\n"))

    const result = await findOpenCodeBinaryWithVersion(["oc"], spawn as never)

    expect(result).toEqual({ binary: "opencode", version: "1.2.3" })
  })

  it("preserves opencode-desktop as desktop binary type", async () => {
    const spawn = mock((_command: string[], _options: object) => createProc(0, "2.0.0\n"))

    const result = await findOpenCodeBinaryWithVersion(["opencode-desktop"], spawn as never)

    expect(result).toEqual({ binary: "opencode-desktop", version: "2.0.0" })
  })
})
