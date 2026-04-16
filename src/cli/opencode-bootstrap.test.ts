/// <reference path="../../bun-test.d.ts" />

import { describe, expect, it, mock } from "bun:test"

import { bootstrapOpenCodeIntegration } from "./opencode-bootstrap"
import type { DetectedConfig, InstallConfig } from "./types"

const detectedConfig: DetectedConfig = {
  isInstalled: false,
  installedVersion: null,
  hasClaude: true,
  isMax20: true,
  hasOpenAI: true,
  hasGemini: false,
  hasCopilot: false,
  hasOpencodeZen: true,
  hasZaiCodingPlan: false,
  hasKimiForCoding: false,
  hasOpencodeGo: false,
}

describe("bootstrapOpenCodeIntegration", () => {
  it("does nothing when OpenCode is unavailable", async () => {
    const addPluginToOpenCodeConfig = mock(async () => ({ success: true }))
    const writeOmoConfig = mock((_config: InstallConfig) => ({ success: true }))

    await bootstrapOpenCodeIntegration({
      isOpenCodeInstalled: async () => false,
      addPluginToOpenCodeConfig,
      detectCurrentConfig: () => detectedConfig,
      writeOmoConfig,
      warn: () => {},
    })

    expect(addPluginToOpenCodeConfig).not.toHaveBeenCalled()
    expect(writeOmoConfig).not.toHaveBeenCalled()
  })

  it("configures plugin and config on first run", async () => {
    const addPluginToOpenCodeConfig = mock(async () => ({ success: true }))
    const writeOmoConfig = mock((_config: InstallConfig) => ({ success: true }))

    await bootstrapOpenCodeIntegration({
      version: "1.0.0",
      isOpenCodeInstalled: async () => true,
      addPluginToOpenCodeConfig,
      detectCurrentConfig: () => detectedConfig,
      writeOmoConfig,
      warn: () => {},
    })

    expect(addPluginToOpenCodeConfig).toHaveBeenCalledWith("1.0.0")
    expect(writeOmoConfig).toHaveBeenCalledWith({
      hasClaude: true,
      isMax20: true,
      hasOpenAI: true,
      hasGemini: false,
      hasCopilot: false,
      hasOpencodeZen: true,
      hasZaiCodingPlan: false,
      hasKimiForCoding: false,
      hasOpencodeGo: false,
    })
  })

  it("still delegates to config merge when OMR config already exists", async () => {
    const addPluginToOpenCodeConfig = mock(async () => ({ success: true }))
    const writeOmoConfig = mock((_config: InstallConfig) => ({ success: true }))

    await bootstrapOpenCodeIntegration({
      version: "1.0.0",
      isOpenCodeInstalled: async () => true,
      addPluginToOpenCodeConfig,
      detectCurrentConfig: () => ({ ...detectedConfig, isInstalled: true, installedVersion: "1.0.0" }),
      writeOmoConfig,
      warn: () => {},
    })

    expect(addPluginToOpenCodeConfig).toHaveBeenCalledWith("1.0.0")
    expect(writeOmoConfig).toHaveBeenCalled()
  })
})
