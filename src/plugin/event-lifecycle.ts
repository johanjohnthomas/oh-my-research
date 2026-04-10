import {
  clearSessionAgent,
  getMainSessionID,
  setMainSession,
  subagentSessions,
  syncSubagentSessions,
} from "../features/session-state"
import {
  clearBackgroundOutputConsumptionsForParentSession,
  clearBackgroundOutputConsumptionsForTaskSession,
  restoreBackgroundOutputConsumption,
} from "../shared/background-output-consumption"
import { resetMessageCursor } from "../shared"
import { clearSessionModel } from "../shared/session-model-state"
import { clearSessionPromptParams } from "../shared/session-prompt-params-state"
import { deleteSessionTools } from "../shared/session-tools-store"
import { clearPendingModelFallback, clearSessionFallbackChain } from "../hooks/model-fallback/hook"
import { lspManager } from "../tools"

import type { EventInput, FirstMessageVariantGate } from "./event-types"

export async function handleLifecycleEvents(args: {
  input: EventInput
  firstMessageVariantGate: FirstMessageVariantGate
  tmuxIntegrationEnabled: boolean
  tmuxSessionManager: {
    onSessionCreated?: (event: {
      type: string
      properties?: { info?: { id?: string; parentID?: string; title?: string } }
    }) => Promise<unknown>
    onSessionDeleted?: (input: { sessionID: string }) => Promise<unknown>
  }
  skillMcpManager: { disconnectSession?: (sessionID: string) => Promise<unknown> }
  clearModelFallbackState: (sessionID: string) => void
}): Promise<void> {
  const { input, firstMessageVariantGate, tmuxIntegrationEnabled, tmuxSessionManager, skillMcpManager, clearModelFallbackState } = args
  const props = input.event.properties as Record<string, unknown> | undefined

  if (input.event.type === "session.created") {
    const sessionInfo = props?.info as { id?: string; title?: string; parentID?: string } | undefined
    if (!sessionInfo?.parentID) setMainSession(sessionInfo?.id)
    firstMessageVariantGate.markSessionCreated(sessionInfo)
    if (tmuxIntegrationEnabled) {
      await tmuxSessionManager.onSessionCreated?.(input.event as {
        type: string
        properties?: { info?: { id?: string; parentID?: string; title?: string } }
      })
    }
    return
  }

  if (input.event.type === "session.deleted") {
    const sessionInfo = props?.info as { id?: string } | undefined
    if (sessionInfo?.id === getMainSessionID()) setMainSession(undefined)
    if (!sessionInfo?.id) return

    const wasSyncSubagentSession = syncSubagentSessions.has(sessionInfo.id)
    clearSessionAgent(sessionInfo.id)
    clearModelFallbackState(sessionInfo.id)
    clearPendingModelFallback(sessionInfo.id)
    clearSessionFallbackChain(sessionInfo.id)
    resetMessageCursor(sessionInfo.id)
    clearBackgroundOutputConsumptionsForParentSession(sessionInfo.id)
    clearBackgroundOutputConsumptionsForTaskSession(sessionInfo.id)
    firstMessageVariantGate.clear(sessionInfo.id)
    clearSessionModel(sessionInfo.id)
    clearSessionPromptParams(sessionInfo.id)
    syncSubagentSessions.delete(sessionInfo.id)
    if (wasSyncSubagentSession) subagentSessions.delete(sessionInfo.id)
    deleteSessionTools(sessionInfo.id)
    await skillMcpManager.disconnectSession?.(sessionInfo.id)
    await lspManager.cleanupTempDirectoryClients()
    if (tmuxIntegrationEnabled) {
      await tmuxSessionManager.onSessionDeleted?.({ sessionID: sessionInfo.id })
    }
    return
  }

  if (input.event.type === "message.removed") {
    const messageID = props?.messageID as string | undefined
    const sessionID = props?.sessionID as string | undefined
    restoreBackgroundOutputConsumption(sessionID, messageID)
    return
  }

}
