import {
  discoverInstalledPlugins,
  loadPluginCommands,
  loadPluginSkillsAsCommands,
} from "../features/host-plugin-loader"
import type { CommandDefinition } from "../features/host-command-loader"

export interface HostCommandDiscoveryOptions {
  pluginsEnabled?: boolean
  enabledPluginsOverride?: Record<string, boolean>
}

export function discoverHostCommandDefinitions(
  options?: HostCommandDiscoveryOptions,
): Record<string, CommandDefinition> {
  if (options?.pluginsEnabled === false) {
    return {}
  }

  const { plugins } = discoverInstalledPlugins({
    enabledPluginsOverride: options?.enabledPluginsOverride,
  })

  return {
    ...loadPluginCommands(plugins),
    ...loadPluginSkillsAsCommands(plugins),
  }
}
