#!/usr/bin/env bun
import { existsSync, rmSync } from "node:fs"
import { createOhMyResearchJsonSchema } from "./build-schema-document"

const SCHEMA_OUTPUT_PATH = "assets/oh-my-research.schema.json"
const DIST_SCHEMA_OUTPUT_PATH = "dist/oh-my-research.schema.json"
const LEGACY_SCHEMA_OUTPUT_PATH = "assets/oh-my-opencode.schema.json"
const LEGACY_DIST_SCHEMA_OUTPUT_PATH = "dist/oh-my-opencode.schema.json"

async function main() {
  console.log("Generating JSON Schema...")

  const finalSchema = createOhMyResearchJsonSchema()
  if (existsSync(LEGACY_SCHEMA_OUTPUT_PATH)) {
    rmSync(LEGACY_SCHEMA_OUTPUT_PATH)
  }
  if (existsSync(LEGACY_DIST_SCHEMA_OUTPUT_PATH)) {
    rmSync(LEGACY_DIST_SCHEMA_OUTPUT_PATH)
  }
  await Bun.write(SCHEMA_OUTPUT_PATH, JSON.stringify(finalSchema, null, 2))
  await Bun.write(DIST_SCHEMA_OUTPUT_PATH, JSON.stringify(finalSchema, null, 2))

  console.log(`✓ JSON Schema generated: ${SCHEMA_OUTPUT_PATH}`)
}

main()
