import { describe, it, expect } from "bun:test"
import { PACKAGE_NAME, PLUGIN_NAME, CONFIG_BASENAME, LOG_FILENAME, CACHE_DIR_NAME } from "./plugin-identity"

describe("plugin-identity constants", () => {
  describe("PACKAGE_NAME", () => {
    it("equals the scoped npm package name", () => {
      expect(PACKAGE_NAME).toBe("@johanjohnthomas/oh-my-research")
    })
  })

  describe("PLUGIN_NAME", () => {
    it("equals oh-my-research", () => {
      // given

      // when

      // then
      expect(PLUGIN_NAME).toBe("oh-my-research")
    })
  })

  describe("CONFIG_BASENAME", () => {
    it("equals oh-my-research", () => {
      // given

      // when

      // then
      expect(CONFIG_BASENAME).toBe("oh-my-research")
    })
  })

  describe("LOG_FILENAME", () => {
    it("equals oh-my-research.log", () => {
      // given

      // when

      // then
      expect(LOG_FILENAME).toBe("oh-my-research.log")
    })
  })

  describe("CACHE_DIR_NAME", () => {
    it("equals oh-my-research", () => {
      // given

      // when

      // then
      expect(CACHE_DIR_NAME).toBe("oh-my-research")
    })
  })
})
