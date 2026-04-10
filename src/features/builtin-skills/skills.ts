import type { BuiltinSkill } from "./types"
import type { BrowserAutomationProvider } from "../../config/schema"
import { normalizeDisabledSkillAliases } from "../research-runtime-registry"

import {
  playwrightSkill,
  agentBrowserSkill,
  playwrightCliSkill,
  frontendUiUxSkill,
  gitMasterSkill,
  devBrowserSkill,
  reviewWorkSkill,
  aiSlopRemoverSkill,
} from "./skills/index"

export interface CreateBuiltinSkillsOptions {
  browserProvider?: BrowserAutomationProvider
  disabledSkills?: Set<string>
}

export function createBuiltinSkills(options: CreateBuiltinSkillsOptions = {}): BuiltinSkill[] {
  const { browserProvider = "playwright", disabledSkills } = options

  let browserSkill: BuiltinSkill
  if (browserProvider === "agent-browser") {
    browserSkill = agentBrowserSkill
  } else if (browserProvider === "playwright-cli") {
    browserSkill = playwrightCliSkill
  } else {
    browserSkill = playwrightSkill
  }

  const skills = [browserSkill, frontendUiUxSkill, gitMasterSkill, devBrowserSkill, reviewWorkSkill, aiSlopRemoverSkill]
  const normalizedDisabledSkills = disabledSkills ? normalizeDisabledSkillAliases(disabledSkills) : undefined

  if (!normalizedDisabledSkills) {
    return skills
  }

  return skills.filter((skill) => !normalizedDisabledSkills.has(skill.name))
}
