/// <reference types="bun-types" />

import { afterEach, describe, expect, test } from "bun:test"
import { existsSync, mkdtempSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { createInitialResearchWorkflowState } from "./state"
import {
  appendWorkflowStageRun,
  clearWorkflowErrorArtifact,
  readWorkflowStageRuns,
  readWorkflowState,
  writeWorkflowErrorArtifact,
  writeWorkflowState,
} from "./storage"

let tempDirectory: string | null = null

afterEach(() => {
  if (tempDirectory) {
    rmSync(tempDirectory, { recursive: true, force: true })
    tempDirectory = null
  }
})

describe("workflow storage", () => {
  test("writes and reads workflow state", () => {
    tempDirectory = mkdtempSync(join(tmpdir(), "research-workflow-"))
    const state = createInitialResearchWorkflowState("paper-1", "run-1")

    writeWorkflowState(tempDirectory, state)

    expect(readWorkflowState(tempDirectory)).toEqual(state)
  })

  test("appends and reads stage runs", () => {
    tempDirectory = mkdtempSync(join(tmpdir(), "research-workflow-"))

    appendWorkflowStageRun(tempDirectory, {
      id: "stage-run-1",
      manuscriptId: "paper-1",
      runId: "run-1",
      stage: "ingest",
      status: "completed",
      queuedAt: "2026-04-08T00:00:00.000Z",
      startedAt: "2026-04-08T00:00:01.000Z",
      completedAt: "2026-04-08T00:00:02.000Z",
      resultPath: ".research/references/generated.bib",
    })

    expect(readWorkflowStageRuns(tempDirectory)).toHaveLength(1)
    expect(readWorkflowStageRuns(tempDirectory)[0]?.stage).toBe("ingest")
  })

  test("writes and clears workflow error artifact", () => {
    tempDirectory = mkdtempSync(join(tmpdir(), "research-workflow-"))

    const errorPath = writeWorkflowErrorArtifact({
      directory: tempDirectory,
      stage: "draft",
      message: "missing artifact",
    })

    expect(existsSync(errorPath)).toBe(true)

    clearWorkflowErrorArtifact(tempDirectory)

    expect(existsSync(errorPath)).toBe(false)
  })
})
