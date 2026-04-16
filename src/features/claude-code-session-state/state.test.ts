/// <reference path="../../../bun-test.d.ts" />

import { describe, it as test, expect, beforeEach, afterEach } from "bun:test"
import {
  setSessionAgent,
  getSessionAgent,
  clearSessionAgent,
  updateSessionAgent,
  setMainSession,
  getMainSessionID,
  registerAgentName,
  isAgentRegistered,
  resolveRegisteredAgentName,
  _resetForTesting,
} from "./state"

describe("claude-code-session-state", () => {
  beforeEach(() => {
    // given - clean state before each test
    _resetForTesting()
  })

  afterEach(() => {
    // then - cleanup after each test to prevent pollution
    _resetForTesting()
  })

  describe("setSessionAgent", () => {
    test("should store agent for session", () => {
      // given
      const sessionID = "test-session-1"
      const agent = "Workflow Planner"

      // when
      setSessionAgent(sessionID, agent)

      // then
      expect(getSessionAgent(sessionID)).toBe(agent)
    })

    test("should strip zero-width ordering prefixes before storing agent for session", () => {
      // given
      const sessionID = "test-session-prefixed"
      const agent = "\u200B\u200B\u200BWorkflow Planner"

      // when
      setSessionAgent(sessionID, agent)

      // then
      expect(getSessionAgent(sessionID)).toBe("Workflow Planner")
    })

    test("should NOT overwrite existing agent (first-write wins)", () => {
      // given
      const sessionID = "test-session-1"
      setSessionAgent(sessionID, "Workflow Planner")

      // when - try to overwrite
      setSessionAgent(sessionID, "sisyphus")

      // then - first agent preserved
      expect(getSessionAgent(sessionID)).toBe("Workflow Planner")
    })

    test("should return undefined for unknown session", () => {
      // given - no session set

      // when / then
      expect(getSessionAgent("unknown-session")).toBe(undefined)
    })
  })

  describe("updateSessionAgent", () => {
    test("should overwrite existing agent", () => {
      // given
      const sessionID = "test-session-1"
      setSessionAgent(sessionID, "Workflow Planner")

      // when - force update
      updateSessionAgent(sessionID, "sisyphus")

      // then
      expect(getSessionAgent(sessionID)).toBe("sisyphus")
    })

    test("should strip zero-width ordering prefixes when overwriting existing agent", () => {
      // given
      const sessionID = "test-session-prefixed-update"
      setSessionAgent(sessionID, "sisyphus")

      // when
      updateSessionAgent(sessionID, "\u200B\u200BDeep Researcher")

      // then
      expect(getSessionAgent(sessionID)).toBe("Deep Researcher")
    })
  })

  describe("clearSessionAgent", () => {
    test("should remove agent from session", () => {
      // given
      const sessionID = "test-session-1"
      setSessionAgent(sessionID, "Workflow Planner")
      expect(getSessionAgent(sessionID)).toBe("Workflow Planner")

      // when
      clearSessionAgent(sessionID)

      // then
      expect(getSessionAgent(sessionID)).toBe(undefined)
    })
  })

  describe("mainSessionID", () => {
    test("should store and retrieve main session ID", () => {
      // given
      const mainID = "main-session-123"

      // when
      setMainSession(mainID)

      // then
      expect(getMainSessionID()).toBe(mainID)
    })

    test("should return undefined when not set", () => {
      // given - explicit reset to ensure clean state (parallel test isolation)
      _resetForTesting()
      // then
      expect(getMainSessionID()).toBe(undefined)
    })
  })

  describe("agent registration", () => {
    test("should register config-key lookup when given a display name", () => {
      // given
      registerAgentName("Workflow Operator")

      // when / then
      expect(isAgentRegistered("atlas")).toBe(true)
      expect(isAgentRegistered("Workflow Operator")).toBe(true)
    })

    test("should resolve config keys back to the registered raw agent name", () => {
      // given
      registerAgentName("\u200B\u200B\u200B\u200BWorkflow Operator")

      // when / then
      expect(resolveRegisteredAgentName("atlas")).toBe("\u200B\u200B\u200B\u200BWorkflow Operator")
      expect(resolveRegisteredAgentName("Workflow Operator")).toBe("\u200B\u200B\u200B\u200BWorkflow Operator")
    })

    describe("#given atlas display name with zero-width prefix", () => {
      describe("#when checking registration without the zero-width prefix", () => {
        test("#then it treats the display name as registered", () => {
          // given
          registerAgentName("\u200BWorkflow Operator")

          // when
          const isRegistered = isAgentRegistered("Workflow Operator")

          // then
          expect(isRegistered).toBe(true)
        })
      })
    })
  })

  describe("prometheus-md-only integration scenario", () => {
    test("should correctly identify Prometheus agent for permission checks", () => {
      // given - Prometheus session
      const sessionID = "test-prometheus-session"
      const prometheusAgent = "Workflow Planner"

      // when - agent is set (simulating chat.message hook)
      setSessionAgent(sessionID, prometheusAgent)

      // then - getSessionAgent returns correct agent for prometheus-md-only hook
      const agent = getSessionAgent(sessionID)
      expect(agent).toBe("Workflow Planner")
      expect(["Workflow Planner"].includes(agent!)).toBe(true)
    })

    test("should return undefined when agent not set (bug scenario)", () => {
      // given - session exists but no agent set (the bug)
      const sessionID = "test-prometheus-session"

      // when / then - this is the bug: agent is undefined
      expect(getSessionAgent(sessionID)).toBe(undefined)
    })
  })

  describe("issue #893: custom agent switch reset", () => {
    test("should preserve custom agent when default agent is sent on subsequent messages", () => {
      // given - user switches to custom agent "MyCustomAgent"
      const sessionID = "test-session-custom"
      const customAgent = "MyCustomAgent"
      const defaultAgent = "sisyphus"

      // User switches to custom agent (via UI)
      setSessionAgent(sessionID, customAgent)
      expect(getSessionAgent(sessionID)).toBe(customAgent)

      // when - first message after switch sends default agent
      // This simulates the bug: input.agent = "Sisyphus" on first message
      // Using setSessionAgent (first-write wins) should preserve custom agent
      setSessionAgent(sessionID, defaultAgent)

      // then - custom agent should be preserved, NOT overwritten
      expect(getSessionAgent(sessionID)).toBe(customAgent)
    })

    test("should allow explicit agent update via updateSessionAgent", () => {
      // given - custom agent is set
      const sessionID = "test-session-explicit"
      const customAgent = "MyCustomAgent"
      const newAgent = "AnotherAgent"

      setSessionAgent(sessionID, customAgent)

      // when - explicit update (user intentionally switches)
      updateSessionAgent(sessionID, newAgent)

      // then - should be updated
      expect(getSessionAgent(sessionID)).toBe(newAgent)
    })
  })
})
