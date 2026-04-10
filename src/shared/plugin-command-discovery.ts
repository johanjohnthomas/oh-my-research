import { discoverHostCommandDefinitions } from "./host-command-discovery"

export interface PluginCommandDiscoveryOptions {
  pluginsEnabled?: boolean
  enabledPluginsOverride?: Record<string, boolean>
}

export function discoverPluginCommandDefinitions(
  options?: PluginCommandDiscoveryOptions,
) {
  return discoverHostCommandDefinitions(options)
}
