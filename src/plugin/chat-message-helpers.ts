import type { OhMyResearchConfig } from "../config"
import { getMainSessionID, subagentSessions } from "../features/session-state"
import { parseRalphLoopArguments } from "../hooks/ralph-loop/command-arguments"
import { getAgentConfigKey } from "../shared/agent-display-names"
import { getSessionModel } from "../shared/session-model-state"

import type { CreatedHooks } from "../create-hooks"

export type ChatMessagePart = { type: string; text?: string; [key: string]: unknown }
export type ChatMessageHandlerOutput = { message: Record<string, unknown>; parts: ChatMessagePart[] }
export type ChatMessageInput = {
  sessionID: string
  agent?: string
  model?: { providerID: string; modelID: string }
}

type StartWorkHookOutput = { parts: Array<{ type: string; text?: string }> }
type SessionModelOverride = { providerID: string; modelID: string }
type RawLoopCommand =
  | { command: "ralph-loop" | "ulw-loop"; args: string }
  | { command: "cancel-ralph"; args: "" }

type RalphLoopCapableHooks = Pick<CreatedHooks, "ralphLoop">

export function isStartWorkHookOutput(value: unknown): value is StartWorkHookOutput {
  if (typeof value !== "object" || value === null) return false
  const record = value as Record<string, unknown>
  const partsValue = record["parts"]
  if (!Array.isArray(partsValue)) return false
  return partsValue.every((part) => {
    if (typeof part !== "object" || part === null) return false
    const partRecord = part as Record<string, unknown>
    return typeof partRecord["type"] === "string"
  })
}

export function getStoredMainSessionModel(
  input: ChatMessageInput,
  pluginConfig: OhMyResearchConfig,
  isFirstMessage: boolean,
  output: ChatMessageHandlerOutput
): SessionModelOverride | undefined {
  if (isFirstMessage || subagentSessions.has(input.sessionID) || getMainSessionID() !== input.sessionID) {
    return undefined
  }

  if (input.model || output.message["model"] !== undefined) {
    return undefined
  }

  const configuredAgents = pluginConfig.agents
  const normalizedAgent = typeof input.agent === "string" ? getAgentConfigKey(input.agent) : undefined
  if (normalizedAgent && configuredAgents && normalizedAgent in configuredAgents) {
    const configuredAgent = configuredAgents[normalizedAgent as keyof typeof configuredAgents]
    const configuredModel = configuredAgent?.model
    if (typeof configuredModel === "string" && configuredModel.trim().length > 0) {
      return undefined
    }
  }

  return getSessionModel(input.sessionID)
}

function parseRawLoopSlashCommand(promptText: string): RawLoopCommand | null {
  const trimmed = promptText.trim()
  const commandText = trimmed.startsWith("/") ? trimmed : undefined

  if (!commandText) return null

  if (/^\/cancel-ralph(?:\s+.*)?$/i.test(commandText)) {
    return { command: "cancel-ralph", args: "" }
  }

  const loopMatch = commandText.match(/^\/(ralph-loop|ulw-loop)\s*([\s\S]*)$/i)
  if (!loopMatch) return null

  const command = loopMatch[1]?.toLowerCase()
  const args = loopMatch[2]?.trim() ?? ""
  return command === "ralph-loop" || command === "ulw-loop" ? { command, args } : null
}

export function maybeHandleRalphLoopCommand(
  hooks: RalphLoopCapableHooks,
  input: ChatMessageInput,
  output: ChatMessageHandlerOutput
): void {
  if (!hooks.ralphLoop) return

  const textParts = output.parts?.filter((part) => part.type === "text" && part.text) ?? []
  const promptText = textParts.map((part) => part.text).join("\n").trim()
  const explicitCommandText =
    textParts.length === 1 && typeof textParts[0]?.text === "string" ? textParts[0].text.trim() : ""

  const isRalphLoopTemplate =
    promptText.includes("You are starting a Ralph Loop") && promptText.includes("<user-task>")
  const isUlwLoopTemplate =
    promptText.includes("You are starting an ULTRAWORK Loop") && promptText.includes("<user-task>")
  const isCancelRalphTemplate = promptText.includes("Cancel the currently active Ralph Loop")
  const rawLoopCommand =
    !isRalphLoopTemplate && !isUlwLoopTemplate && !isCancelRalphTemplate
      ? parseRawLoopSlashCommand(explicitCommandText)
      : null

  if (
    isRalphLoopTemplate ||
    isUlwLoopTemplate ||
    rawLoopCommand?.command === "ralph-loop" ||
    rawLoopCommand?.command === "ulw-loop"
  ) {
    const taskMatch = promptText.match(/<user-task>\s*([\s\S]*?)\s*<\/user-task>/i)
    const rawTask = taskMatch?.[1]?.trim() || rawLoopCommand?.args || ""
    const parsedArguments = parseRalphLoopArguments(rawTask)
    const ultrawork = isUlwLoopTemplate || rawLoopCommand?.command === "ulw-loop"

    hooks.ralphLoop.startLoop(input.sessionID, parsedArguments.prompt, {
      ultrawork,
      maxIterations: parsedArguments.maxIterations,
      completionPromise: parsedArguments.completionPromise,
      strategy: parsedArguments.strategy,
    })
    return
  }

  if (isCancelRalphTemplate || rawLoopCommand?.command === "cancel-ralph") {
    hooks.ralphLoop.cancelLoop(input.sessionID)
  }
}
