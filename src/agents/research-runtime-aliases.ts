import type { AgentConfig } from "@opencode-ai/sdk"
import type { AvailableAgent } from "./dynamic-agent-prompt-types"
import type { AgentOverrides } from "./types"

const RESEARCH_AGENT_ALIAS_SPECS = {
	research_ingest: {
		target: "librarian",
		description: "Research ingest role for gathering sources and references.",
	},
	research_bibliography: {
		target: "librarian",
		description: "Research bibliography role for reference and citation ingestion.",
	},
	research_extract: {
		target: "explore",
		description: "Research extraction role for pulling evidence from available artifacts and context.",
	},
	research_synthesize: {
		target: "hephaestus",
		description: "Research synthesis role for converting evidence into claims and structure.",
	},
	research_draft: {
		target: "hephaestus",
		description: "Research drafting role for manuscript generation and revision.",
	},
	research_verification: {
		target: "oracle",
		description: "Research verification role for checking citations, evidence, and manuscript integrity.",
	},
	research_review: {
		target: "oracle",
		description: "Research review role for skeptical final review and quality checks.",
	},
	research_export: {
		target: "atlas",
		description: "Research export role for final artifact emission and workflow completion.",
	},
	research_obsidian: {
		target: "atlas",
		description: "Research Obsidian role for local derived note export and operator flows.",
	},
	research_knowledge_graph: {
		target: "hephaestus",
		description: "Research knowledge-graph role for derived graph construction and updates.",
	},
} as const satisfies Record<string, { target: string; description: string }>

export function addResearchAgentAliases(args: {
	result: Record<string, AgentConfig>
	availableAgents: AvailableAgent[]
}): void {
	for (const [alias, spec] of Object.entries(RESEARCH_AGENT_ALIAS_SPECS)) {
		const targetConfig = args.result[spec.target]
		if (!targetConfig || args.result[alias]) continue

		args.result[alias] = {
			...targetConfig,
			description: spec.description,
		}

		const targetAvailableAgent = args.availableAgents.find((agent) => agent.name === spec.target)
		if (targetAvailableAgent) {
			args.availableAgents.push({
				name: alias,
				description: spec.description,
				metadata: targetAvailableAgent.metadata,
			})
		}
	}
}

export type ResearchRuntimeAgentAliasName = keyof typeof RESEARCH_AGENT_ALIAS_SPECS

export function normalizeResearchAgentAliases(args: {
	disabledAgents: string[]
	agentOverrides: AgentOverrides
}): { disabledAgents: string[]; agentOverrides: AgentOverrides } {
	const nextDisabledAgents = new Set(args.disabledAgents)
	const nextAgentOverrides: AgentOverrides = { ...args.agentOverrides }

	for (const [alias, spec] of Object.entries(RESEARCH_AGENT_ALIAS_SPECS)) {
		if (nextDisabledAgents.has(alias)) {
			nextDisabledAgents.add(spec.target)
		}

		const aliasOverride = nextAgentOverrides[alias as keyof AgentOverrides]
		if (!aliasOverride) continue

		nextAgentOverrides[spec.target as keyof AgentOverrides] = {
			...(nextAgentOverrides[spec.target as keyof AgentOverrides] ?? {}),
			...aliasOverride,
		}
	}

	return {
		disabledAgents: Array.from(nextDisabledAgents),
		agentOverrides: nextAgentOverrides,
	}
}
