import { getAgentConfigKey } from "../../shared/agent-display-names"

export const subagentSessions = new Set<string>()
export const syncSubagentSessions = new Set<string>()

let mainSessionID: string | undefined

export function setMainSession(id: string | undefined): void {
  mainSessionID = id
}

export function getMainSessionID(): string | undefined {
  return mainSessionID
}

const registeredAgentNames = new Set<string>()
const registeredAgentAliases = new Map<string, string>()
const zeroWidthCharactersRegex = /[\u200B\u200C\u200D\uFEFF]/g
const sessionAgentMap = new Map<string, string>()

function normalizeRegisteredAgentName(name: string): string {
  return name.replace(zeroWidthCharactersRegex, "").toLowerCase()
}

function normalizeStoredAgentName(name: string): string {
  return name.replace(zeroWidthCharactersRegex, "")
}

export function registerAgentName(name: string): void {
  const normalizedName = normalizeRegisteredAgentName(name)
  registeredAgentNames.add(normalizedName)
  if (!registeredAgentAliases.has(normalizedName)) {
    registeredAgentAliases.set(normalizedName, name)
  }

  const configKey = normalizeRegisteredAgentName(getAgentConfigKey(name))
  if (configKey !== normalizedName) {
    registeredAgentNames.add(configKey)
    if (!registeredAgentAliases.has(configKey)) {
      registeredAgentAliases.set(configKey, name)
    }
  }
}

export function isAgentRegistered(name: string): boolean {
  return registeredAgentNames.has(normalizeRegisteredAgentName(name))
}

export function resolveRegisteredAgentName(name: string | undefined): string | undefined {
  if (typeof name !== "string") {
    return undefined
  }

  const normalizedName = normalizeRegisteredAgentName(name)
  return registeredAgentAliases.get(normalizedName) ?? normalizeStoredAgentName(name)
}

export function setSessionAgent(sessionID: string, agent: string): void {
  if (!sessionAgentMap.has(sessionID)) {
    sessionAgentMap.set(sessionID, normalizeStoredAgentName(agent))
  }
}

export function updateSessionAgent(sessionID: string, agent: string): void {
  sessionAgentMap.set(sessionID, normalizeStoredAgentName(agent))
}

export function getSessionAgent(sessionID: string): string | undefined {
  return sessionAgentMap.get(sessionID)
}

export function clearSessionAgent(sessionID: string): void {
  sessionAgentMap.delete(sessionID)
}

export function _resetForTesting(): void {
  mainSessionID = undefined
  subagentSessions.clear()
  syncSubagentSessions.clear()
  sessionAgentMap.clear()
  registeredAgentNames.clear()
  registeredAgentAliases.clear()
}
