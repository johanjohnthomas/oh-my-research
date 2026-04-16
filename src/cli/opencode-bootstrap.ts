import packageJson from "../../package.json" with { type: "json" }
import {
  addPluginToOpenCodeConfig,
  detectCurrentConfig,
  isOpenCodeInstalled,
  writeOmoConfig,
} from "./config-manager"
import type { DetectedConfig, InstallConfig } from "./types"

type BootstrapDeps = {
  version: string
  isOpenCodeInstalled: () => Promise<boolean>
  detectCurrentConfig: () => DetectedConfig
  addPluginToOpenCodeConfig: (currentVersion: string) => Promise<{ success: boolean; error?: string }>
  writeOmoConfig: (config: InstallConfig) => { success: boolean; error?: string }
  warn: (message: string) => void
}

function toInstallConfig(config: DetectedConfig): InstallConfig {
  return {
    hasClaude: config.hasClaude,
    isMax20: config.isMax20,
    hasOpenAI: config.hasOpenAI,
    hasGemini: config.hasGemini,
    hasCopilot: config.hasCopilot,
    hasOpencodeZen: config.hasOpencodeZen,
    hasZaiCodingPlan: config.hasZaiCodingPlan,
    hasKimiForCoding: config.hasKimiForCoding,
    hasOpencodeGo: config.hasOpencodeGo,
  }
}

export async function bootstrapOpenCodeIntegration(deps?: Partial<BootstrapDeps>): Promise<void> {
  const resolvedDeps: BootstrapDeps = {
    version: packageJson.version,
    isOpenCodeInstalled,
    detectCurrentConfig,
    addPluginToOpenCodeConfig,
    writeOmoConfig,
    warn: (message) => console.warn(message),
    ...deps,
  }

  if (!(await resolvedDeps.isOpenCodeInstalled())) {
    return
  }

  const pluginResult = await resolvedDeps.addPluginToOpenCodeConfig(resolvedDeps.version)
  if (!pluginResult.success) {
    resolvedDeps.warn(`[oh-my-research] OpenCode setup skipped: ${pluginResult.error ?? "unknown plugin config error"}`)
    return
  }

  const configResult = resolvedDeps.writeOmoConfig(toInstallConfig(resolvedDeps.detectCurrentConfig()))
  if (!configResult.success) {
    resolvedDeps.warn(`[oh-my-research] OpenCode config bootstrap skipped: ${configResult.error ?? "unknown config write error"}`)
  }
}
