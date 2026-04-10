import { chmodSync, mkdtempSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { spawnSync } from "node:child_process"

function run(command: string, args: string[], cwd: string, env: Record<string, string> = {}) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf-8",
    stdio: "pipe",
    env: {
      ...process.env,
      ...env,
    },
  })

  if (result.status !== 0) {
    throw new Error(
      [
        `${command} ${args.join(" ")} failed with status ${result.status}`,
        result.stdout,
        result.stderr,
      ].join("\n"),
    )
  }

  return result.stdout.trim()
}

function assertExists(path: string) {
  if (!existsSync(path)) {
    throw new Error(`Expected artifact missing: ${path}`)
  }
}

const repoRoot = process.cwd()
const workspaceDir = mkdtempSync(join(tmpdir(), "oh-my-research-verify-"))
const packageDir = mkdtempSync(join(tmpdir(), "oh-my-research-pack-"))
const opencodeDir = mkdtempSync(join(tmpdir(), "oh-my-research-opencode-"))
const fakeBinDir = mkdtempSync(join(tmpdir(), "oh-my-research-bin-"))

try {
  run("bun", ["run", "build"], repoRoot)
  run("bun", ["run", "src/cli/index.ts", "workspace-init", "--title", "Verification Paper", "--directory", workspaceDir], repoRoot)
  run("bun", ["run", "src/cli/index.ts", "workspace-run", "--workspace", `${workspaceDir}/workspace.json`, "--directory", workspaceDir], repoRoot)
  run("bun", ["run", "src/cli/index.ts", "obsidian-export", "--workspace", `${workspaceDir}/workspace.json`, "--directory", workspaceDir], repoRoot)
  run("bun", ["run", "src/cli/index.ts", "kg-build", "--workspace", `${workspaceDir}/workspace.json`, "--directory", workspaceDir], repoRoot)
  run("bun", ["run", "src/cli/index.ts", "obsidian-open", "--vault", "ResearchVault", "--note", "claims", "--directory", workspaceDir], repoRoot)

  assertExists(`${workspaceDir}/workspace.json`)
  assertExists(`${workspaceDir}/.research/manuscript/build/main.pdf`)
  assertExists(`${workspaceDir}/.research/verification/report.json`)
  assertExists(`${workspaceDir}/.research/verification/report.md`)
  assertExists(`${workspaceDir}/.research/derived/obsidian/claims.md`)
  assertExists(`${workspaceDir}/.research/derived/knowledge-graph/graph.json`)

  const tarball = run("npm", ["pack", "--silent"], repoRoot).split("\n").filter(Boolean).at(-1)
  if (!tarball) {
    throw new Error("npm pack did not produce a tarball name")
  }

  run("npm", ["init", "-y"], packageDir)
  run("npm", ["install", `${repoRoot}/${tarball}`], packageDir)
  run("bun", ["-e", 'import("@johanjohnthomas/oh-my-research").then((m)=>console.log(Object.keys(m).length))'], packageDir)

  const fakeOpenCodePath = join(fakeBinDir, "opencode")
  writeFileSync(fakeOpenCodePath, "#!/bin/sh\necho 1.0.0\n", "utf-8")
  chmodSync(fakeOpenCodePath, 0o755)
  mkdirSync(opencodeDir, { recursive: true })

  run(
    `${packageDir}/node_modules/.bin/oh-my-research`,
    ["--help"],
    packageDir,
    {
      PATH: `${fakeBinDir}:${process.env.PATH ?? ""}`,
      OPENCODE_CONFIG_DIR: opencodeDir,
    },
  )

  assertExists(`${opencodeDir}/opencode.json`)
  assertExists(`${opencodeDir}/oh-my-research.json`)

  console.log("Product verification completed")
  console.log(`Workspace: ${workspaceDir}`)
  console.log(`Package test: ${packageDir}`)
  console.log(`OpenCode config: ${opencodeDir}`)
} finally {
  rmSync(workspaceDir, { recursive: true, force: true })
  rmSync(packageDir, { recursive: true, force: true })
  rmSync(opencodeDir, { recursive: true, force: true })
  rmSync(fakeBinDir, { recursive: true, force: true })
}
