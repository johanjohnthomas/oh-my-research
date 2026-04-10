import { log } from "../shared/logger"

import type { CreatedHooks } from "../create-hooks"
import type { EventInput } from "./event-types"

export function createEventHookDispatcher(hooks: CreatedHooks) {
  const getEventSessionID = (input: EventInput): string | undefined => {
    const properties = input.event.properties
    if (
      !properties ||
      typeof properties !== "object" ||
      !("sessionID" in properties) ||
      typeof properties.sessionID !== "string"
    ) {
      return undefined
    }
    return properties.sessionID
  }

  const runEventHookSafely = async (
    hookName: string,
    handler: ((input: EventInput) => unknown | Promise<unknown>) | null | undefined,
    input: EventInput,
  ): Promise<void> => {
    if (!handler) return
    try {
      await Promise.resolve(handler(input))
    } catch (error) {
      log("[event] hook execution failed", {
        hook: hookName,
        eventType: input.event.type,
        sessionID: getEventSessionID(input),
        error,
      })
    }
  }

  const dispatchToHooks = async (input: EventInput): Promise<void> => {
    await runEventHookSafely("autoUpdateChecker", hooks.autoUpdateChecker?.event, input)
    await runEventHookSafely("legacyPluginToast", hooks.legacyPluginToast?.event, input)
    await runEventHookSafely("claudeCodeHooks", hooks.claudeCodeHooks?.event, input)
    await runEventHookSafely("backgroundNotificationHook", hooks.backgroundNotificationHook?.event, input)
    await runEventHookSafely("sessionNotification", hooks.sessionNotification, input)
    await runEventHookSafely("todoContinuationEnforcer", hooks.todoContinuationEnforcer?.handler, input)
    await runEventHookSafely("unstableAgentBabysitter", hooks.unstableAgentBabysitter?.event, input)
    await runEventHookSafely("contextWindowMonitor", hooks.contextWindowMonitor?.event, input)
    await runEventHookSafely("preemptiveCompaction", hooks.preemptiveCompaction?.event, input)
    await runEventHookSafely("directoryAgentsInjector", hooks.directoryAgentsInjector?.event, input)
    await runEventHookSafely("directoryReadmeInjector", hooks.directoryReadmeInjector?.event, input)
    await runEventHookSafely("rulesInjector", hooks.rulesInjector?.event, input)
    await runEventHookSafely("thinkMode", hooks.thinkMode?.event, input)
    await runEventHookSafely("anthropicContextWindowLimitRecovery", hooks.anthropicContextWindowLimitRecovery?.event, input)
    await runEventHookSafely("runtimeFallback", hooks.runtimeFallback?.event, input)
    await runEventHookSafely("agentUsageReminder", hooks.agentUsageReminder?.event, input)
    await runEventHookSafely("categorySkillReminder", hooks.categorySkillReminder?.event, input)
    await runEventHookSafely("interactiveBashSession", hooks.interactiveBashSession?.event, input)
    await runEventHookSafely("ralphLoop", hooks.ralphLoop?.event, input)
    await runEventHookSafely("stopContinuationGuard", hooks.stopContinuationGuard?.event, input)
    await runEventHookSafely("compactionContextInjector", hooks.compactionContextInjector?.event, input)
    await runEventHookSafely("compactionTodoPreserver", hooks.compactionTodoPreserver?.event, input)
    await runEventHookSafely("writeExistingFileGuard", hooks.writeExistingFileGuard?.event, input)
    await runEventHookSafely("atlasHook", hooks.atlasHook?.handler, input)
    await runEventHookSafely("autoSlashCommand", hooks.autoSlashCommand?.event, input)
  }

  return { dispatchToHooks }
}
