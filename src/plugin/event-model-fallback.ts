import {
  getMainSessionID,
  getSessionAgent,
  updateSessionAgent,
} from "../features/session-state"
import { log } from "../shared/logger"
import { shouldRetryError } from "../shared/model-error-classifier"
import { clearSessionModel, setSessionModel } from "../shared/session-model-state"
import { setPendingModelFallback } from "../hooks/model-fallback/hook"

import type { CreatedHooks } from "../create-hooks"
import type { OhMyResearchConfig } from "../config"
import type { EventInput, EventPluginContext } from "./event-types"
import {
  applyUserConfiguredFallbackChain,
  extractErrorMessage,
  extractErrorName,
  extractProviderModelFromErrorMessage,
  isCompactionAgent,
  normalizeFallbackModelID,
} from "./event-utils"
import {
  autoContinueAfterFallback,
  getDefaultAgentName,
  resolveFallbackProviderID,
  shouldAutoRetrySession,
} from "./event-model-fallback-helpers"

export function createEventModelFallbackRuntime(args: {
  pluginContext: EventPluginContext
  pluginConfig: OhMyResearchConfig
  hooks: CreatedHooks
}) {
  const { pluginContext, pluginConfig, hooks } = args
  const lastHandledModelErrorMessageID = new Map<string, string>()
  const lastHandledRetryStatusKey = new Map<string, string>()
  const lastKnownModelBySession = new Map<string, { providerID: string; modelID: string }>()

  const isRuntimeFallbackEnabled =
    hooks.runtimeFallback !== null &&
    hooks.runtimeFallback !== undefined &&
    (typeof pluginConfig.runtime_fallback === "boolean"
      ? pluginConfig.runtime_fallback
      : (pluginConfig.runtime_fallback?.enabled ?? false))
  const isModelFallbackEnabled = hooks.modelFallback !== null && hooks.modelFallback !== undefined

  async function handleMessageUpdated(input: EventInput): Promise<void> {
    const properties = input.event.properties as Record<string, unknown> | undefined
    const info = properties?.info as Record<string, unknown> | undefined
    const sessionID = info?.sessionID as string | undefined
    const agent = info?.agent as string | undefined
    const role = info?.role as string | undefined
    if (sessionID && role === "user") {
      const isCompactionMessage = agent ? isCompactionAgent(agent) : false
      if (agent && !isCompactionMessage) updateSessionAgent(sessionID, agent)
      const providerID = info?.providerID as string | undefined
      const modelID = info?.modelID as string | undefined
      if (providerID && modelID && !isCompactionMessage) {
        lastKnownModelBySession.set(sessionID, { providerID, modelID })
        setSessionModel(sessionID, { providerID, modelID })
      }
    }

    if (!(sessionID && role === "assistant" && !isRuntimeFallbackEnabled && isModelFallbackEnabled)) return
    try {
      const assistantMessageID = info?.id as string | undefined
      const assistantError = info?.error
      if (!(assistantMessageID && assistantError) || lastHandledModelErrorMessageID.get(sessionID) === assistantMessageID) return
      const errorInfo = { name: extractErrorName(assistantError), message: extractErrorMessage(assistantError) }
      if (!shouldRetryError(errorInfo)) return
      let agentName = agent ?? getSessionAgent(sessionID)
      if (!agentName && sessionID === getMainSessionID()) {
        agentName = getDefaultAgentName(errorInfo.message)
      }
      if (!agentName) return
      const currentProvider = resolveFallbackProviderID(lastKnownModelBySession, sessionID, info?.providerID as string | undefined)
      const currentModel = normalizeFallbackModelID((info?.modelID as string | undefined) ?? "claude-opus-4-6")
      applyUserConfiguredFallbackChain(sessionID, agentName, currentProvider, pluginConfig)
      const setFallback = setPendingModelFallback(sessionID, agentName, currentProvider, currentModel)
      if (setFallback && shouldAutoRetrySession(sessionID) && !hooks.stopContinuationGuard?.isStopped(sessionID)) {
        lastHandledModelErrorMessageID.set(sessionID, assistantMessageID)
        await autoContinueAfterFallback(pluginContext, sessionID, "message.updated")
      }
    } catch (error) {
      log("[event] model-fallback error in message.updated:", { sessionID, error })
    }
  }

  async function handleSessionStatus(input: EventInput): Promise<void> {
    if (!(!isRuntimeFallbackEnabled && isModelFallbackEnabled)) return
    const props = input.event.properties as Record<string, unknown> | undefined
    const sessionID = props?.sessionID as string | undefined
    const status = props?.status as { type?: string; attempt?: number; message?: string } | undefined
    if (!sessionID || !status) return
    if (status.type === "idle") {
      lastHandledRetryStatusKey.delete(sessionID)
      return
    }
    if (status.type !== "retry") return

    try {
      const retryMessage = typeof status.message === "string" ? status.message : ""
      const parsedForKey = extractProviderModelFromErrorMessage(retryMessage)
      const retryAttempt = typeof status.attempt === "number" ? status.attempt : 0
      const retryKey = `${retryAttempt}:${parsedForKey.providerID ?? ""}/${parsedForKey.modelID ?? ""}:${retryMessage.replace(/retrying in \d+m?\s*\d*s?/i, "retrying")}`
      if (lastHandledRetryStatusKey.get(sessionID) === retryKey) return
      lastHandledRetryStatusKey.set(sessionID, retryKey)

      const errorInfo = { name: undefined as string | undefined, message: retryMessage }
      if (!shouldRetryError(errorInfo)) return
      let agentName = getSessionAgent(sessionID)
      if (!agentName && sessionID === getMainSessionID()) {
        agentName = getDefaultAgentName(retryMessage)
      }
      if (!agentName) return
      const parsed = extractProviderModelFromErrorMessage(retryMessage)
      const lastKnown = lastKnownModelBySession.get(sessionID)
      const currentProvider = resolveFallbackProviderID(lastKnownModelBySession, sessionID, parsed.providerID)
      const currentModel = normalizeFallbackModelID(parsed.modelID ?? lastKnown?.modelID ?? "claude-opus-4-6")
      applyUserConfiguredFallbackChain(sessionID, agentName, currentProvider, pluginConfig)
      const setFallback = setPendingModelFallback(sessionID, agentName, currentProvider, currentModel)
      if (setFallback && shouldAutoRetrySession(sessionID) && !hooks.stopContinuationGuard?.isStopped(sessionID)) {
        await autoContinueAfterFallback(pluginContext, sessionID, "session.status")
      }
    } catch (error) {
      log("[event] model-fallback error in session.status:", { sessionID, error })
    }
  }

  async function handleSessionError(input: EventInput): Promise<void> {
    const props = input.event.properties as Record<string, unknown> | undefined
    const sessionID = props?.sessionID as string | undefined
    const error = props?.error
    try {
      if (hooks.sessionRecovery?.isRecoverableError(error)) {
        const recovered = await hooks.sessionRecovery.handleSessionRecovery({
          id: props?.messageID as string | undefined,
          role: "assistant",
          sessionID,
          error,
        })
        if (recovered && sessionID && sessionID === getMainSessionID() && !hooks.stopContinuationGuard?.isStopped(sessionID)) {
          await pluginContext.client.session
            .summarize({ path: { id: sessionID }, body: { auto: true }, query: { directory: pluginContext.directory } })
            .catch((sessionError: unknown) => {
              log("[event] compaction before recovery continue failed:", { sessionID, error: sessionError })
            })
          await pluginContext.client.session
            .prompt({ path: { id: sessionID }, body: { parts: [{ type: "text", text: "continue" }] }, query: { directory: pluginContext.directory } })
            .catch(() => {})
        }
        return
      }

      if (!(sessionID && !isRuntimeFallbackEnabled && isModelFallbackEnabled)) return
      const errorInfo = { name: extractErrorName(error), message: extractErrorMessage(error) }
      if (!shouldRetryError(errorInfo)) return
      let agentName = getSessionAgent(sessionID)
      if (!agentName && sessionID === getMainSessionID()) {
        agentName = getDefaultAgentName(errorInfo.message)
      }
      if (!agentName) return
      const parsed = extractProviderModelFromErrorMessage(errorInfo.message)
      const currentProvider = resolveFallbackProviderID(lastKnownModelBySession, sessionID, (props?.providerID as string | undefined) || parsed.providerID)
      const currentModel = normalizeFallbackModelID((props?.modelID as string | undefined) || parsed.modelID || "claude-opus-4-6")
      applyUserConfiguredFallbackChain(sessionID, agentName, currentProvider, pluginConfig)
      const setFallback = setPendingModelFallback(sessionID, agentName, currentProvider, currentModel)
      if (setFallback && shouldAutoRetrySession(sessionID) && !hooks.stopContinuationGuard?.isStopped(sessionID)) {
        await autoContinueAfterFallback(pluginContext, sessionID, "session.error")
      }
    } catch (sessionError) {
      log("[event] model-fallback error in session.error:", { sessionID, error: sessionError })
    }
  }

  function clearSessionState(sessionID: string): void {
    lastHandledModelErrorMessageID.delete(sessionID)
    lastHandledRetryStatusKey.delete(sessionID)
    lastKnownModelBySession.delete(sessionID)
    clearSessionModel(sessionID)
  }

  return { handleMessageUpdated, handleSessionStatus, handleSessionError, clearSessionState }
}
