import { checkForLegacyPluginEntry } from "./legacy-plugin-warning"
import { log } from "./logger"
import { migrateLegacyPluginEntry } from "./migrate-legacy-plugin-entry"
import { toCanonicalEntry } from "./plugin-entry-migrator"
import { LEGACY_PACKAGE_NAME, LEGACY_PLUGIN_NAME, PACKAGE_NAME } from "./plugin-identity"

type LogLegacyPluginStartupWarningDeps = {
  checkForLegacyPluginEntry?: typeof checkForLegacyPluginEntry
  log?: typeof log
  migrateLegacyPluginEntry?: typeof migrateLegacyPluginEntry
}

export function logLegacyPluginStartupWarning(deps: LogLegacyPluginStartupWarningDeps = {}): void {
  const checkForLegacyPluginEntryFn = deps.checkForLegacyPluginEntry ?? checkForLegacyPluginEntry
  const logFn = deps.log ?? log
  const migrateLegacyPluginEntryFn = deps.migrateLegacyPluginEntry ?? migrateLegacyPluginEntry

  const result = checkForLegacyPluginEntryFn()
  if (!result.hasLegacyEntry) {
    return
  }

  const suggestedEntries = result.legacyEntries.map(toCanonicalEntry)

  logFn("[OhMyOpenCodePlugin] Legacy plugin entry detected in OpenCode config", {
    legacyEntries: result.legacyEntries,
    suggestedEntries,
    hasCanonicalEntry: result.hasCanonicalEntry,
  })

  console.warn(
    `[oh-my-openagent] WARNING: Your opencode.json uses a legacy package entry such as "${LEGACY_PACKAGE_NAME}" or "${LEGACY_PLUGIN_NAME}".`
    + ` The package has been renamed to "${PACKAGE_NAME}".`
    + ` Attempting auto-migration...`,
  )

  const migrated = migrateLegacyPluginEntryFn(result.configPath!)
  if (migrated) {
    console.warn(`[oh-my-openagent] Auto-migrated opencode.json: ${result.legacyEntries.join(", ")} -> ${suggestedEntries.join(", ")}`)
  } else {
    console.warn(
      `[oh-my-openagent] Could not auto-migrate. Please manually update your opencode.json:`
      + ` ${result.legacyEntries.map((e, i) => `"${e}" -> "${suggestedEntries[i]}"`).join(", ")}`,
    )
  }
}
