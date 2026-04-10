import type { ToolDefinition } from "@opencode-ai/plugin"
import type { BuiltinSkill } from "./builtin-skills/types"
import type { AvailableSkill, AvailableTool } from "../agents/dynamic-agent-prompt-types"

const RESEARCH_SKILL_ALIAS_SPECS = {
	research_review: {
		target: "review-work",
		description: "Research review workflow skill for skeptical verification and QA.",
	},
	research_cleanup: {
		target: "ai-slop-remover",
		description: "Research workflow cleanup skill for tightening generated code and prose.",
	},
	research_browser_validation: {
		target: "playwright",
		description: "Research browser validation skill for checking exported or rendered outputs.",
	},
} as const

const RESEARCH_TOOL_ALIAS_SPECS = {
	research_delegate: {
		target: "task",
		category: "command",
	},
	research_skill_lookup: {
		target: "skill",
		category: "command",
	},
	research_session_lookup: {
		target: "session_read",
		category: "session",
	},
	research_artifact_search: {
		target: "grep",
		category: "search",
	},
	research_artifact_glob: {
		target: "glob",
		category: "search",
	},
	} as const satisfies Record<string, { target: string; category: AvailableTool["category"] }>

export function addResearchBuiltinSkillAliases(skills: BuiltinSkill[]): BuiltinSkill[] {
	const next = [...skills]

	for (const [alias, spec] of Object.entries(RESEARCH_SKILL_ALIAS_SPECS)) {
		const target = skills.find((skill) => skill.name === spec.target)
		if (!target || next.some((skill) => skill.name === alias)) continue

		next.push({
			...target,
			name: alias,
			description: spec.description,
		})
	}

	return next
}

export function normalizeDisabledSkillAliases(disabledSkills: Set<string>): Set<string> {
	const next = new Set(disabledSkills)

	for (const [alias, spec] of Object.entries(RESEARCH_SKILL_ALIAS_SPECS)) {
		if (disabledSkills.has(alias)) {
			next.add(spec.target)
		}
	}

	return next
}

export function addResearchSkillAliases(skills: AvailableSkill[]): AvailableSkill[] {
	const next = [...skills]

	for (const [alias, spec] of Object.entries(RESEARCH_SKILL_ALIAS_SPECS)) {
		const target = skills.find((skill) => skill.name === spec.target)
		if (!target || next.some((skill) => skill.name === alias)) continue

		next.push({
			name: alias,
			description: spec.description,
			location: target.location,
		})
	}

	return next
}

export function addResearchToolAliases(tools: AvailableTool[]): AvailableTool[] {
	const next = [...tools]

	for (const [alias, spec] of Object.entries(RESEARCH_TOOL_ALIAS_SPECS)) {
		if (next.some((tool) => tool.name === alias)) continue

		next.push({
			name: alias,
			category: spec.category,
		})
	}

	return next
}

export function addResearchToolDefinitions(tools: Record<string, ToolDefinition>): Record<string, ToolDefinition> {
	const next = { ...tools }

	for (const [alias, spec] of Object.entries(RESEARCH_TOOL_ALIAS_SPECS)) {
		const target = tools[spec.target]
		if (!target || next[alias]) continue

		next[alias] = target
	}

	return next
}
