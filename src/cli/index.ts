#!/usr/bin/env bun
import { runCli } from "./cli-program"
import { bootstrapOpenCodeIntegration } from "./opencode-bootstrap"

await bootstrapOpenCodeIntegration()
await runCli()
