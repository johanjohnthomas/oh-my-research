import type { OhMyResearchConfig } from "../config"
import { hasConnectedProvidersCache } from "../shared"
import { setSessionAgent } from "../features/session-state"
import { setSessionModel } from "../shared/session-model-state"

import type { CreatedHooks } from "../create-hooks"
import { applyUltraworkModelOverrideOnMessage } from "./ultrawork-model-override"
import type { PluginContext } from "./types"
import {
  getStoredMainSessionModel,
  isStartWorkHookOutput,
  maybeHandleRalphLoopCommand,
  type ChatMessageHandlerOutput,
  type ChatMessageInput,
} from "./chat-message-helpers"

type FirstMessageVariantGate = {
  shouldOverride: (sessionID: string) => boolean
  markApplied: (sessionID: string) => void
}

export type { ChatMessageHandlerOutput, ChatMessageInput } from "./chat-message-helpers"

export function createChatMessageHandler(args: {
  ctx: PluginContext
  pluginConfig: OhMyResearchConfig
  firstMessageVariantGate: FirstMessageVariantGate
  hooks: CreatedHooks
}): (input: ChatMessageInput, output: ChatMessageHandlerOutput) => Promise<void> {
  const { ctx, pluginConfig, firstMessageVariantGate, hooks } = args
  const pluginContext = ctx as {
    client: {
      tui: {
        showToast: (input: {
          body: { title: string; message: string; variant: "warning"; duration: number }
        }) => Promise<unknown>
      }
    }
  }
  return async (input, output): Promise<void> => {
    if (input.agent) {
      setSessionAgent(input.sessionID, input.agent)
    }

    const isFirstMessage = firstMessageVariantGate.shouldOverride(input.sessionID)
    if (isFirstMessage) {
      firstMessageVariantGate.markApplied(input.sessionID)
    }

    const storedMainSessionModel = getStoredMainSessionModel(input, pluginConfig, isFirstMessage, output)
    if (storedMainSessionModel) {
      output.message["model"] = storedMainSessionModel
    }

    const modelOverride = output.message["model"]
    if (
      modelOverride &&
      typeof modelOverride === "object" &&
      "providerID" in modelOverride &&
      "modelID" in modelOverride
    ) {
      const providerID = (modelOverride as { providerID?: string }).providerID
      const modelID = (modelOverride as { modelID?: string }).modelID
      if (typeof providerID === "string" && typeof modelID === "string") {
        setSessionModel(input.sessionID, { providerID, modelID })
      }
    } else if (input.model) {
      setSessionModel(input.sessionID, input.model)
    }

    await hooks.stopContinuationGuard?.["chat.message"]?.(input)
    await hooks.backgroundNotificationHook?.["chat.message"]?.(input, output)
    await hooks.keywordDetector?.["chat.message"]?.(input, output)
    await hooks.thinkMode?.["chat.message"]?.(input, output)
    await hooks.claudeCodeHooks?.["chat.message"]?.(input, output)
    await hooks.autoSlashCommand?.["chat.message"]?.(input, output)
    await hooks.noSisyphusGpt?.["chat.message"]?.(input, output)
    await hooks.noHephaestusNonGpt?.["chat.message"]?.(input, output)
    if (hooks.startWork && isStartWorkHookOutput(output)) {
      await hooks.startWork["chat.message"]?.(input, output)
    }

    if (!hasConnectedProvidersCache()) {
      pluginContext.client.tui
        .showToast({
          body: {
            title: "⚠️ Provider Cache Missing",
            message: "Model filtering disabled. RESTART OpenCode to enable full functionality.",
            variant: "warning",
            duration: 6000,
          },
        })
        .catch(() => {})
    }

    maybeHandleRalphLoopCommand(hooks, input, output)

    await applyUltraworkModelOverrideOnMessage(
      pluginConfig,
      input.agent,
      output,
      pluginContext.client.tui,
      input.sessionID,
      pluginContext.client,
    )
  }
}
