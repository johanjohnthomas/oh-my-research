#!/usr/bin/env bun
import { runCli } from "./cli-program"
import { bootstrapOpenCodeIntegration } from "./opencode-bootstrap"

await bootstrapOpenCodeIntegration()

if (process.env.OH_MY_RESEARCH_BOOTSTRAP_ONLY !== "1") {
  await runCli()
}
