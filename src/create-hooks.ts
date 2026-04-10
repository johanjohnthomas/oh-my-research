import type { AvailableSkill } from "./agents/dynamic-agent-prompt-builder"
import type { HookName, OhMyResearchConfig } from "./config"
import type { LoadedSkill } from "./features/opencode-skill-loader/types"
import type { BackgroundManager } from "./features/background-agent"
import type { ModelCacheState } from "./plugin-state"
import type { RuntimeContext } from "./runtime-context"

import { createCoreHooks } from "./plugin/hooks/create-core-hooks"
import { createContinuationHooks } from "./plugin/hooks/create-continuation-hooks"
import { createSkillHooks } from "./plugin/hooks/create-skill-hooks"

export type CreatedHooks = ReturnType<typeof createHooks>

type DisposableHook = { dispose?: () => void } | null | undefined

export type DisposableCreatedHooks = {
  hostCompatibilityHooks?: DisposableHook
  claudeCodeHooks?: DisposableHook
  commentChecker?: DisposableHook
  runtimeFallback?: DisposableHook
  todoContinuationEnforcer?: DisposableHook
  autoSlashCommand?: DisposableHook
  anthropicContextWindowLimitRecovery?: DisposableHook
}

export function disposeCreatedHooks(hooks: DisposableCreatedHooks): void {
  const disposedHooks = new Set<DisposableHook>()
  const disposeHook = (hook: DisposableHook): void => {
    if (!hook || disposedHooks.has(hook)) {
      return
    }
    disposedHooks.add(hook)
    hook.dispose?.()
  }

  disposeHook(hooks.claudeCodeHooks)
  disposeHook(hooks.hostCompatibilityHooks)
  hooks.commentChecker?.dispose?.()
  hooks.runtimeFallback?.dispose?.()
  hooks.todoContinuationEnforcer?.dispose?.()
  hooks.autoSlashCommand?.dispose?.()
  hooks.anthropicContextWindowLimitRecovery?.dispose?.()
}

export function createHooks(args: {
  ctx: RuntimeContext
  pluginConfig: OhMyResearchConfig
  modelCacheState: ModelCacheState
  backgroundManager: BackgroundManager
  isHookEnabled: (hookName: HookName) => boolean
  safeHookEnabled: boolean
  mergedSkills: LoadedSkill[]
  availableSkills: AvailableSkill[]
}) {
  const {
    ctx,
    pluginConfig,
    modelCacheState,
    backgroundManager,
    isHookEnabled,
    safeHookEnabled,
    mergedSkills,
    availableSkills,
  } = args

  const core = createCoreHooks({
    ctx,
    pluginConfig,
    modelCacheState,
    isHookEnabled,
    safeHookEnabled,
  })

  const continuation = createContinuationHooks({
    ctx,
    pluginConfig,
    isHookEnabled,
    safeHookEnabled,
    backgroundManager,
    sessionRecovery: core.sessionRecovery,
  })

  const skill = createSkillHooks({
    ctx,
    pluginConfig,
    isHookEnabled,
    safeHookEnabled,
    mergedSkills,
    availableSkills,
  })

  const hooks = {
    ...core,
    ...continuation,
    ...skill,
  }

  return {
    ...hooks,
    disposeHooks: (): void => {
      disposeCreatedHooks(hooks)
    },
  }
}
