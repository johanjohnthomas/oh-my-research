import type { OpenCodeBinaryType } from "../../shared/opencode-config-dir-types"
import { spawnWithWindowsHide } from "../../shared/spawn-with-windows-hide"
import { initConfigContext } from "./config-context"

const DEFAULT_OPENCODE_BINARIES = ["opencode", "opencode-desktop"] as const

interface OpenCodeBinaryResult {
  binary: OpenCodeBinaryType
  version: string
}

export function getOpenCodeBinaryCandidates(
  envValue: string | undefined = process.env.OH_MY_RESEARCH_OPENCODE_BINARIES,
): string[] {
  const configured = envValue
    ?.split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0)

  if (!configured || configured.length === 0) {
    return [...DEFAULT_OPENCODE_BINARIES]
  }

  return Array.from(new Set(configured))
}

function resolveBinaryType(binary: string): OpenCodeBinaryType {
  return binary === "opencode-desktop" ? "opencode-desktop" : "opencode"
}

export async function findOpenCodeBinaryWithVersion(
  candidates: string[] = getOpenCodeBinaryCandidates(),
  spawn: typeof spawnWithWindowsHide = spawnWithWindowsHide,
): Promise<OpenCodeBinaryResult | null> {
  for (const binary of candidates) {
    try {
      const proc = spawn([binary, "--version"], {
        stdout: "pipe",
        stderr: "pipe",
      })
      const output = await new Response(proc.stdout).text()
      await proc.exited
      if (proc.exitCode === 0) {
        const version = output.trim()
        const resolvedBinary = resolveBinaryType(binary)
        initConfigContext(resolvedBinary, version)
        return { binary: resolvedBinary, version }
      }
    } catch {
      continue
    }
  }
  return null
}

export async function isOpenCodeInstalled(): Promise<boolean> {
  const result = await findOpenCodeBinaryWithVersion()
  return result !== null
}

export async function getOpenCodeVersion(): Promise<string | null> {
  const result = await findOpenCodeBinaryWithVersion()
  return result?.version ?? null
}
