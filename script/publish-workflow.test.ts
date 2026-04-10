/// <reference types="bun-types" />

import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const workflowPaths = [
  new URL("../.github/workflows/ci.yml", import.meta.url),
]

describe("test workflows", () => {
  test("use pure bun test for workflows", () => {
    for (const workflowPath of workflowPaths) {
      // #given
      const workflow = readFileSync(workflowPath, "utf8")

      expect(workflow).toContain("- name: Run tests")
      expect(workflow).toMatch(/run: bun (test|run script\/run-ci-tests\.ts)/)
      expect(workflow).toContain("dist/research-runtime.js")
      expect(workflow).toContain("dist/research-runtime.d.ts")
      expect(workflow).toContain("dist/cli/index.js")
      expect(workflow).toContain("bun run verify:product")
      expect(workflow).not.toContain("dist/index.js")
      expect(workflow).not.toContain("dist/index.d.ts")
    }
  })
})
