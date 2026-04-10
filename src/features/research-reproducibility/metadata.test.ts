/// <reference types="bun-types" />

import { afterEach, describe, expect, test } from "bun:test"
import { mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { collectGeneratedArtifacts, writeRunMetadata } from "./metadata"

let tempDirectory: string | null = null

afterEach(() => {
  if (tempDirectory) {
    rmSync(tempDirectory, { recursive: true, force: true })
    tempDirectory = null
  }
})

describe("collectGeneratedArtifacts", () => {
  test("hashes generated files", () => {
    tempDirectory = mkdtempSync(join(tmpdir(), "research-repro-"))
    const filePath = `${tempDirectory}/artifact.txt`
    writeFileSync(filePath, "artifact", "utf-8")

    const artifacts = collectGeneratedArtifacts([filePath])

    expect(artifacts).toHaveLength(1)
    expect(artifacts[0]?.sha256.length).toBeGreaterThan(0)
  })
})

describe("writeRunMetadata", () => {
  test("writes metadata to the run directory", () => {
    tempDirectory = mkdtempSync(join(tmpdir(), "research-repro-"))
    const outputPath = writeRunMetadata({
      directory: tempDirectory,
      metadata: {
        runId: "run-1",
        generatedAt: "2026-04-08T00:00:00.000Z",
        workflowVersion: "oh-my-research@3.16.0",
        configVersion: "oh-my-research-config/v1",
        promptVersion: "research-workflow-prompt/v1",
        toolVersions: { bun: "1.3.6" },
        modelVersions: {},
        sourceHashes: { "scripts/eval.py": "sha256-1" },
        generatedArtifacts: [],
      },
    })

    expect(existsSync(outputPath)).toBe(true)
    expect(readFileSync(outputPath, "utf-8")).toContain("run-1")
  })
})
