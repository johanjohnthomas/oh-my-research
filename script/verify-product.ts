import { mkdtempSync, existsSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { spawnSync } from "node:child_process"

function run(command: string, args: string[], cwd: string) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf-8",
    stdio: "pipe",
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
  run("bun", ["-e", 'import("oh-my-research").then((m)=>console.log(Object.keys(m).length))'], packageDir)
  run(`${packageDir}/node_modules/.bin/oh-my-research`, ["--help"], packageDir)

  console.log("Product verification completed")
  console.log(`Workspace: ${workspaceDir}`)
  console.log(`Package test: ${packageDir}`)
} finally {
  rmSync(workspaceDir, { recursive: true, force: true })
  rmSync(packageDir, { recursive: true, force: true })
}
