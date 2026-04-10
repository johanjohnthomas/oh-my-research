/// <reference types="bun-types" />

import { describe, expect, test } from "bun:test"
import { getResearchRoleForStage, researchWorkflowRoles } from "./roles"

describe("researchWorkflowRoles", () => {
  test("defines all stage roles", () => {
    expect(Object.keys(researchWorkflowRoles)).toEqual([
      "ingest",
      "extract",
      "synthesize",
      "draft",
      "review",
      "export",
      "obsidian",
      "knowledge-graph",
    ])
  })

  test("maps stages to research roles", () => {
    expect(getResearchRoleForStage("draft")).toEqual({
      name: "draft",
      category: "writing",
      summary: "Draft LaTeX manuscript sections from claims and citations.",
    })
  })
})
