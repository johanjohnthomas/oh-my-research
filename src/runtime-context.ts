import type { PluginInput } from "@opencode-ai/plugin"
import type { SkillLoadOptions } from "./tools/skill/types"

export type RuntimeClient = PluginInput["client"]

export type RuntimeContext = Pick<PluginInput, "client" | "directory" | "project" | "worktree" | "$" | "serverUrl"> & {
	skills?: SkillLoadOptions["nativeSkills"]
}
