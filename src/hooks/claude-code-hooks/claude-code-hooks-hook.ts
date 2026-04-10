import type { PluginConfig } from "./types"
import type { ContextCollector } from "../../features/context-injector"
import type { RuntimeContext } from "../../runtime-context"
import { createChatMessageHandler } from "./handlers/chat-message-handler"
import { createPreCompactHandler } from "./handlers/pre-compact-handler"
import {
  createSessionEventHandler,
  disposeSessionEventHandler,
} from "./handlers/session-event-handler"
import { createToolExecuteAfterHandler } from "./handlers/tool-execute-after-handler"
import { createToolExecuteBeforeHandler } from "./handlers/tool-execute-before-handler"

export function createClaudeCodeHooksHook(
  ctx: RuntimeContext,
  config: PluginConfig = {},
  contextCollector?: ContextCollector
) {
  return {
    "experimental.session.compacting": createPreCompactHandler(ctx, config),
    "chat.message": createChatMessageHandler(ctx, config, contextCollector),
    "tool.execute.before": createToolExecuteBeforeHandler(ctx, config),
    "tool.execute.after": createToolExecuteAfterHandler(ctx, config),
    event: createSessionEventHandler(ctx, config, contextCollector),
    dispose: (): void => {
      disposeSessionEventHandler(contextCollector)
    },
  }
}

export const createHostCompatibilityHooksHook = createClaudeCodeHooksHook
