import { getMainSessionID, subagentSessions, syncSubagentSessions } from "../features/session-state"
import { readConnectedProvidersCache } from "../shared/connected-providers-cache"
import { log } from "../shared/logger"
import { getSessionModel } from "../shared/session-model-state"

import type { EventPluginContext } from "./event-types"

export function resolveFallbackProviderID(
  lastKnownModelBySession: Map<string, { providerID: string; modelID: string }>,
  sessionID: string,
  providerHint?: string,
): string {
  const sessionModel = getSessionModel(sessionID)
  if (sessionModel?.providerID) return sessionModel.providerID
  const lastKnownModel = lastKnownModelBySession.get(sessionID)
  if (lastKnownModel?.providerID) return lastKnownModel.providerID
  const normalizedProviderHint = providerHint?.trim()
  if (normalizedProviderHint) return normalizedProviderHint
  return readConnectedProvidersCache()?.[0] ?? "opencode"
}

export function shouldAutoRetrySession(sessionID: string): boolean {
  if (syncSubagentSessions.has(sessionID)) return true
  const mainSessionID = getMainSessionID()
  return mainSessionID ? sessionID === mainSessionID : !subagentSessions.has(sessionID)
}

export async function autoContinueAfterFallback(
  pluginContext: EventPluginContext,
  sessionID: string,
  source: string,
): Promise<void> {
  await pluginContext.client.session.abort({ path: { id: sessionID } }).catch((error) => {
    log("[event] model-fallback abort failed", { sessionID, source, error })
  })
  const promptBody = {
    path: { id: sessionID },
    body: { parts: [{ type: "text" as const, text: "continue" }] },
    query: { directory: pluginContext.directory },
  }
  if (typeof pluginContext.client.session.promptAsync === "function") {
    await pluginContext.client.session.promptAsync(promptBody).catch((error) => {
      log("[event] model-fallback promptAsync failed", { sessionID, source, error })
    })
    return
  }
  await pluginContext.client.session.prompt(promptBody).catch((error) => {
    log("[event] model-fallback prompt failed", { sessionID, source, error })
  })
}

export function getDefaultAgentName(message: string): string {
  return message.includes("gpt-5") ? "hephaestus" : "sisyphus"
}
