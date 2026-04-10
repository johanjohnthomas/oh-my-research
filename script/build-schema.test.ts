import { describe, expect, test } from "bun:test"
import { createOhMyResearchJsonSchema } from "./build-schema-document"

describe("build-schema-document", () => {
  test("generates schema with skills property", () => {
    // given
    const expectedDraft = "http://json-schema.org/draft-07/schema#"

    // when
    const schema = createOhMyResearchJsonSchema()

    // then
    expect(schema.$schema).toBe(expectedDraft)
    expect(schema.title).toBe("Oh My Research Configuration")
    expect(schema.properties).toBeDefined()
    expect(schema.properties.skills).toBeDefined()
  })

  test("does not expose removed fallback settings in the public schema", () => {
    const schema = createOhMyResearchJsonSchema()
    const properties = (schema.properties ?? {}) as Record<string, unknown>
    const experimental = properties.experimental as { properties?: Record<string, unknown> } | undefined

    expect(properties.model_fallback).toBeUndefined()
    expect(properties.runtime_fallback).toBeUndefined()
    expect(experimental?.properties?.model_fallback_title).toBeUndefined()
  })
})
