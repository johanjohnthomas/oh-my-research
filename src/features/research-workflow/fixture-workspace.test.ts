/// <reference types="bun-types" />

import { describe, expect, test } from "bun:test"
import { createFixtureResearchWorkspace, createStarterResearchWorkspace } from "./fixture-workspace"

describe("createStarterResearchWorkspace", () => {
	test("creates a valid starter workspace for a new paper", () => {
		const workspace = createStarterResearchWorkspace({ title: "My Paper" })

		expect(workspace.manuscript.id).toBe("my-paper")
		expect(workspace.manuscript.title).toBe("My Paper")
		expect(workspace.runs).toHaveLength(1)
		expect(workspace.bibliography.references).toEqual([])
		expect(workspace.claims.claims).toEqual([])
		expect(workspace.evidence).toEqual([])
	})
})

describe("createFixtureResearchWorkspace", () => {
	test("creates a fixture workspace with seeded research artifacts", () => {
		const workspace = createFixtureResearchWorkspace()

		expect(workspace.manuscript.id).toBe("paper-1")
		expect(workspace.bibliography.references).toHaveLength(2)
		expect(workspace.claims.claims).toHaveLength(2)
		expect(workspace.evidence).toHaveLength(1)
	})
})
