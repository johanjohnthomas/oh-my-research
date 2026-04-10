import { spawn, spawnSync } from "node:child_process"
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { basename, dirname, join } from "node:path"
import type { ManuscriptProject } from "../research-artifacts"
import type { ManuscriptBibliographyBackend } from "./templates"

export type ManuscriptBuildBackend = "latexmk" | "tectonic"

export type ManuscriptBuildResult = {
  backend: ManuscriptBuildBackend
  command: string[]
  exitCode: number
  pdfPath: string
  logPath: string
  stdout: string
  stderr: string
}

export function detectAvailableManuscriptBackend(): ManuscriptBuildBackend | null {
  if (commandExists("latexmk")) {
    return "latexmk"
  }

  if (commandExists("tectonic")) {
    return "tectonic"
  }

  return null
}

export function detectAvailableBibliographyBackend(): ManuscriptBibliographyBackend {
  return commandExists("biber") ? "biber" : "bibtex"
}

function commandExists(command: string): boolean {
  const result = spawnSync("sh", ["-lc", `command -v ${command}`], { stdio: "ignore" })
  return result.status === 0
}

export function writeBuildResult(args: {
  directory: string
  result: ManuscriptBuildResult
}): string {
  const outputPath = `${args.directory}/.research/manuscript/build-result.json`
  mkdirSync(`${args.directory}/.research/manuscript`, { recursive: true })
  writeFileSync(outputPath, JSON.stringify(args.result, null, 2), "utf-8")
  return outputPath
}

function needsAdditionalBuildPass(result: { exitCode: number; stdout: string; stderr: string }, logPath: string): boolean {
  if (result.exitCode !== 0) {
    return false
  }

  const logText = existsSync(logPath) ? readFileSync(logPath, "utf-8") : ""
  const combined = `${result.stdout}
${result.stderr}
${logText}`

  return /rerun seems needed|please \(re\)run biber|please \(re\)run bibtex|warnings were issued in the bibliographic references|bibtex.*ignored/i.test(combined)
}

function createBuildCommand(
  backend: ManuscriptBuildBackend,
  mainTexAbsolutePath: string,
  outputDirectory: string,
): string[] {
  if (backend === "tectonic") {
    return [
      "tectonic",
      "--keep-logs",
      "--keep-intermediates",
      "--outdir",
      outputDirectory,
      mainTexAbsolutePath,
    ]
  }

  return [
    "latexmk",
    "-pdf",
    "-interaction=nonstopmode",
    "-outdir=" + outputDirectory,
    mainTexAbsolutePath,
  ]
}

export async function buildManuscript(args: {
  directory: string
  project: ManuscriptProject
  backend?: ManuscriptBuildBackend
  execute?: (command: string[], cwd: string) => Promise<{ exitCode: number; stdout: string; stderr: string }>
}): Promise<ManuscriptBuildResult> {
  const backend = args.backend ?? detectAvailableManuscriptBackend() ?? "latexmk"
  const mainTexAbsolutePath = `${args.directory}/${args.project.mainTexPath}`
  const outputDirectory = join(dirname(mainTexAbsolutePath), "build")
  const bibliographyAbsolutePath = `${args.directory}/${args.project.bibliographyPath}`
  const stagedBibliographyPath = join(dirname(mainTexAbsolutePath), basename(args.project.bibliographyPath))
  const command = createBuildCommand(backend, mainTexAbsolutePath, outputDirectory)
  const execute = args.execute ?? executeCommand
  mkdirSync(outputDirectory, { recursive: true })

  if (existsSync(bibliographyAbsolutePath)) {
    copyFileSync(bibliographyAbsolutePath, stagedBibliographyPath)
  }

  const mainFilename = args.project.mainTexPath.split("/").at(-1)?.replace(/\.tex$/, "") ?? "main"
  const logPath = join(outputDirectory, `${mainFilename}.log`)
  let result = await execute(command, args.directory)

  for (let attempt = 0; attempt < 2 && needsAdditionalBuildPass(result, logPath); attempt++) {
    result = await execute(command, args.directory)
  }

  return {
    backend,
    command,
    exitCode: result.exitCode,
    pdfPath: join(outputDirectory, `${mainFilename}.pdf`),
    logPath,
    stdout: result.stdout,
    stderr: result.stderr,
  }
}

async function executeCommand(
  command: string[],
  cwd: string,
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command[0]!, command.slice(1), { cwd })
    let stdout = ""
    let stderr = ""

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk)
    })

    child.stderr.on("data", (chunk) => {
      stderr += String(chunk)
    })

    child.on("error", reject)
    child.on("close", (exitCode) => {
      resolve({ exitCode: exitCode ?? 1, stdout, stderr })
    })
  })
}
