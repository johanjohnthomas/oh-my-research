import { describe, expect, it } from "bun:test"
import type { OhMyResearchConfig } from "../../config"
import type { ModelCacheState } from "../../plugin-state"
import type { PluginContext } from "../types"
import { createSessionHooks } from "./create-session-hooks"

const mockContext = {
  directory: "/tmp",
  client: {
    tui: {
      showToast: async () => ({}),
    },
    session: {
      get: async () => ({ data: null }),
      update: async () => ({}),
    },
  },
} as unknown as PluginContext

const mockModelCacheState = {} as ModelCacheState

describe("createSessionHooks", () => {
  it("does not expose model fallback hook in the release path", () => {
    // given
    const pluginConfig = {} as OhMyResearchConfig

    // when
    const result = createSessionHooks({
      ctx: mockContext,
      pluginConfig,
      modelCacheState: mockModelCacheState,
      isHookEnabled: () => true,
      safeHookEnabled: true,
    })

    // then
    expect("modelFallback" in result).toBe(false)
    expect("runtimeFallback" in result).toBe(false)
  })

  it("skips interactive bash session hook when tmux integration is disabled", () => {
    // given
    const pluginConfig = {
      tmux: {
        enabled: false,
        layout: "main-vertical",
        main_pane_size: 60,
        main_pane_min_width: 120,
        agent_pane_min_width: 40,
        isolation: "inline",
      },
    } as OhMyResearchConfig

    // when
    const result = createSessionHooks({
      ctx: mockContext,
      pluginConfig,
      modelCacheState: mockModelCacheState,
      isHookEnabled: (hookName) => hookName === "interactive-bash-session",
      safeHookEnabled: true,
    })

    // then
    expect(result.interactiveBashSession).toBeNull()
  })
})
