import {
  getMainSessionID,
  getSessionAgent,
  updateSessionAgent,
} from "../features/session-state"
import { log } from "../shared/logger"
import { shouldRetryError } from "../shared/model-error-classifier"
import { clearSessionModel, setSessionModel } from "../shared/session-model-state"

import type { CreatedHooks } from "../create-hooks"
import type { EventInput, EventPluginContext } from "./event-types"
import { isCompactionAgent } from "./event-utils"

export function createEventModelFallbackRuntime(args: {
  pluginContext: EventPluginContext
  hooks: CreatedHooks
}) {
  const { pluginContext, hooks } = args

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
        setSessionModel(sessionID, { providerID, modelID })
      }
    }
  }

  async function handleSessionStatus(input: EventInput): Promise<void> {
    void input
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

    } catch (sessionError) {
      log("[event] model-fallback error in session.error:", { sessionID, error: sessionError })
    }
  }

  function clearSessionState(sessionID: string): void {
    clearSessionModel(sessionID)
  }

  return { handleMessageUpdated, handleSessionStatus, handleSessionError, clearSessionState }
}
