import { beforeEach } from "bun:test"
import { _resetForTesting as resetSessionState } from "./src/features/session-state/state"
import { _resetForTesting as resetModelFallbackState } from "./src/hooks/model-fallback/hook"
import { _resetMemCacheForTesting as resetConnectedProvidersCache } from "./src/shared/connected-providers-cache"

beforeEach(() => {
  resetSessionState()
  resetModelFallbackState()
  resetConnectedProvidersCache()
})
