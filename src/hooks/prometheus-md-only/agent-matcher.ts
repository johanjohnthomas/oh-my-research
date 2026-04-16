import { PROMETHEUS_AGENT } from "./constants"
import { getAgentConfigKey } from "../../shared/agent-display-names"

export function isPrometheusAgent(agentName: string | undefined): boolean {
  if (!agentName) return false
  return getAgentConfigKey(agentName) === PROMETHEUS_AGENT
}
