import { LEGACY_PACKAGE_NAME, LEGACY_PLUGIN_NAME, PACKAGE_NAME } from "./plugin-identity"

export function isLegacyEntry(entry: string): boolean {
  return entry === LEGACY_PACKAGE_NAME || entry.startsWith(`${LEGACY_PACKAGE_NAME}@`)
    || entry === LEGACY_PLUGIN_NAME || entry.startsWith(`${LEGACY_PLUGIN_NAME}@`)
}

export function isCanonicalEntry(entry: string): boolean {
  return entry === PACKAGE_NAME || entry.startsWith(`${PACKAGE_NAME}@`)
}

export function toCanonicalEntry(entry: string): string {
  if (entry === LEGACY_PACKAGE_NAME) {
    return PACKAGE_NAME
  }

  if (entry.startsWith(`${LEGACY_PACKAGE_NAME}@`)) {
    return `${PACKAGE_NAME}${entry.slice(LEGACY_PACKAGE_NAME.length)}`
  }

  if (entry === LEGACY_PLUGIN_NAME) {
    return PACKAGE_NAME
  }

  if (entry.startsWith(`${LEGACY_PLUGIN_NAME}@`)) {
    return `${PACKAGE_NAME}${entry.slice(LEGACY_PLUGIN_NAME.length)}`
  }

  return entry
}

export function dedupePluginEntries(entries: string[]): string[] {
  return Array.from(new Set(entries))
}
