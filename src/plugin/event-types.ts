import type { CreatedHooks } from "../create-hooks"
import type { Managers } from "../create-managers"
import type { OhMyResearchConfig } from "../config"

import type { PluginContext } from "./types"

export type FirstMessageVariantGate = {
  markSessionCreated: (sessionInfo: { id?: string; title?: string; parentID?: string } | undefined) => void
  clear: (sessionID: string) => void
}

export type EventInput = Parameters<NonNullable<NonNullable<CreatedHooks["writeExistingFileGuard"]>["event"]>>[0]

export type EventPluginContext = {
  directory: string
  client: {
    session: {
      abort: (input: { path: { id: string } }) => Promise<unknown>
      promptAsync?: (input: {
        path: { id: string }
        body: { parts: Array<{ type: "text"; text: string }> }
        query: { directory: string }
      }) => Promise<unknown>
      prompt: (input: {
        path: { id: string }
        body: { parts: Array<{ type: "text"; text: string }> }
        query: { directory: string }
      }) => Promise<unknown>
      summarize: (...args: any[]) => Promise<unknown>
    }
  }
}

export type EventHandlerArgs = {
  ctx: PluginContext
  pluginConfig: OhMyResearchConfig
  firstMessageVariantGate: FirstMessageVariantGate
  managers: Managers
  hooks: CreatedHooks
}
