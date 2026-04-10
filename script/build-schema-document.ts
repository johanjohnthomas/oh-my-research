import { z } from "zod"
import { OhMyResearchConfigSchema } from "../src/config/schema"

export function createOhMyResearchJsonSchema(): Record<string, unknown> {
  const jsonSchema = z.toJSONSchema(OhMyResearchConfigSchema, {
    target: "draft-7",
    unrepresentable: "any",
  }) as Record<string, unknown>

  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: "urn:oh-my-research:schema",
    title: "Oh My Research Configuration",
    description: "Configuration schema for the oh-my-research workflow",
    ...jsonSchema,
  }
}
