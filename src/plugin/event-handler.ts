import type { EventHandlerArgs, EventInput, EventPluginContext } from "./event-types"

import { isTmuxIntegrationEnabled } from "../create-runtime-tmux-config"
import { pruneRecentSyntheticIdles } from "./recent-synthetic-idles"
import { normalizeSessionStatusToIdle } from "./session-status-normalizer"
import { createEventHookDispatcher } from "./event-dispatch"
import { handleLifecycleEvents } from "./event-lifecycle"
import { createEventModelFallbackRuntime } from "./event-model-fallback"

export function createEventHandler(args: EventHandlerArgs) {
  const { ctx, pluginConfig, firstMessageVariantGate, managers, hooks } = args
  const tmuxIntegrationEnabled = isTmuxIntegrationEnabled(pluginConfig)
  const pluginContext = ctx as EventPluginContext
  const { dispatchToHooks } = createEventHookDispatcher(hooks)
  const modelFallbackRuntime = createEventModelFallbackRuntime({ pluginContext, pluginConfig, hooks })

  const recentSyntheticIdles = new Map<string, number>()
  const recentRealIdles = new Map<string, number>()
  const DEDUP_WINDOW_MS = 500
  const TMUX_ACTIVITY_EVENT_TYPES = new Set([
    "message.updated",
    "message.part.updated",
    "message.part.delta",
    "message.part.removed",
    "message.removed",
  ])

  return async (input: EventInput): Promise<void> => {
    pruneRecentSyntheticIdles({
      recentSyntheticIdles,
      recentRealIdles,
      now: Date.now(),
      dedupWindowMs: DEDUP_WINDOW_MS,
    })

    if (input.event.type === "session.idle") {
      const sessionID = (input.event.properties as Record<string, unknown> | undefined)?.sessionID as string | undefined
      if (sessionID) {
        const emittedAt = recentSyntheticIdles.get(sessionID)
        if (emittedAt && Date.now() - emittedAt < DEDUP_WINDOW_MS) {
          recentSyntheticIdles.delete(sessionID)
          return
        }
        recentRealIdles.set(sessionID, Date.now())
      }
    }

    await dispatchToHooks(input)

    const syntheticIdle = normalizeSessionStatusToIdle(input)
    if (syntheticIdle) {
      const sessionID = (syntheticIdle.event.properties as Record<string, unknown>)?.sessionID as string
      const emittedAt = recentRealIdles.get(sessionID)
      if (emittedAt && Date.now() - emittedAt < DEDUP_WINDOW_MS) {
        recentRealIdles.delete(sessionID)
        return
      }
      recentSyntheticIdles.set(sessionID, Date.now())
      await dispatchToHooks(syntheticIdle as EventInput)
    }

    if (tmuxIntegrationEnabled && TMUX_ACTIVITY_EVENT_TYPES.has(input.event.type)) {
      managers.tmuxSessionManager.onEvent?.(input.event as { type: string; properties?: Record<string, unknown> })
    }

    await handleLifecycleEvents({
      input,
      firstMessageVariantGate,
      tmuxIntegrationEnabled,
      tmuxSessionManager: managers.tmuxSessionManager,
      skillMcpManager: managers.skillMcpManager,
      clearModelFallbackState: modelFallbackRuntime.clearSessionState,
    })

    if (input.event.type === "message.updated") {
      await modelFallbackRuntime.handleMessageUpdated(input)
    } else if (input.event.type === "session.status") {
      await modelFallbackRuntime.handleSessionStatus(input)
    } else if (input.event.type === "session.error") {
      await modelFallbackRuntime.handleSessionError(input)
    }
  }
}
