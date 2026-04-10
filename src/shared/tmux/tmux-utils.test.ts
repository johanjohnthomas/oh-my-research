import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import { isInsideTmuxEnvironment } from "./tmux-utils/environment"
import { isInsideTmux, spawnTmuxPane, closeTmuxPane, applyLayout } from "./tmux-utils"
import {
	isServerRunning,
	markServerRunningInProcess,
	resetServerCheck,
} from "./tmux-utils/server-health"

let serverHealthSequence = Promise.resolve()

function runSerialServerHealthTest<T>(fn: () => Promise<T>): Promise<T> {
	const run = serverHealthSequence.then(fn, fn)
	serverHealthSequence = run.then(() => undefined, () => undefined)
	return run
}

type FetchMock = typeof fetch & { calls: Array<[RequestInfo | URL, RequestInit | undefined]> }

function createFetchMock(responseFactory: () => Promise<Response>): FetchMock {
	const calls: Array<[RequestInfo | URL, RequestInit | undefined]> = []
	const fetchMock = (async (input: RequestInfo | URL, init?: RequestInit) => {
		calls.push([input, init])
		return await responseFactory()
	}) as FetchMock
	const preconnect = globalThis.fetch.preconnect?.bind(globalThis.fetch)
	fetchMock.calls = calls
	return Object.assign(fetchMock, {
		preconnect,
	})
}

describe("isInsideTmux", () => {
  test("returns true when TMUX env is set", () => {
    // given
    const environment = { TMUX: "/tmp/tmux-1000/default" }

    // when
    const result = isInsideTmuxEnvironment(environment)

    // then
    expect(result).toBe(true)
  })

  test("returns false when TMUX env is not set", () => {
    // given
    const environment = {}

    // when
    const result = isInsideTmuxEnvironment(environment)

    // then
    expect(result).toBe(false)
  })

  test("returns false when TMUX env is empty string", () => {
    // given
    const environment = { TMUX: "" }

    // when
    const result = isInsideTmuxEnvironment(environment)

    // then
    expect(result).toBe(false)
  })

  test("is exported as a function", async () => {
    // given, #when
    const result = typeof isInsideTmux

    // then
    expect(result).toBe("function")
  })
})

describe("isServerRunning", () => {
  const originalFetch = globalThis.fetch

	beforeEach(() => {
		resetServerCheck()
	})

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  test("returns true when server responds OK", async () => {
    await runSerialServerHealthTest(async () => {
      // given
      const fetchMock = createFetchMock(async () => new Response(null, { status: 200 }))
      globalThis.fetch = fetchMock

      // when
      const result = await isServerRunning("http://localhost:4096", { fetchImpl: fetchMock, ignoreInProcessFlag: true, ignoreCache: true })

      // then
      expect(result).toBe(true)
    })
  })

  test("returns false when server not reachable", async () => {
    await runSerialServerHealthTest(async () => {
      // given
      const fetchMock = createFetchMock(async () => {
        throw new Error("ECONNREFUSED")
      })
      globalThis.fetch = fetchMock

      // when
      const result = await isServerRunning("http://localhost:4096", { fetchImpl: fetchMock, ignoreInProcessFlag: true, ignoreCache: true })

      // then
      expect(result).toBe(false)
    })
  })

  test("returns false when fetch returns not ok", async () => {
    await runSerialServerHealthTest(async () => {
      // given
      const fetchMock = createFetchMock(async () => new Response(null, { status: 500 }))
      globalThis.fetch = fetchMock

      // when
      const result = await isServerRunning("http://localhost:4096", { fetchImpl: fetchMock, ignoreInProcessFlag: true, ignoreCache: true })

      // then
      expect(result).toBe(false)
    })
  })

  test("caches successful result", async () => {
    await runSerialServerHealthTest(async () => {
      // given
      const fetchMock = createFetchMock(async () => new Response(null, { status: 200 }))
      globalThis.fetch = fetchMock

      // when
      await isServerRunning("http://localhost:4096", { fetchImpl: fetchMock, ignoreInProcessFlag: true })
      await isServerRunning("http://localhost:4096", { fetchImpl: fetchMock, ignoreInProcessFlag: true })

      // then - should only call fetch once due to caching
      expect(fetchMock.calls.length).toBe(1)
    })
  })

  test("does not cache failed result", async () => {
    await runSerialServerHealthTest(async () => {
      // given
      const fetchMock = createFetchMock(async () => {
        throw new Error("ECONNREFUSED")
      })
      globalThis.fetch = fetchMock

      // when
      await isServerRunning("http://localhost:4096", { fetchImpl: fetchMock, ignoreInProcessFlag: true, ignoreCache: true })
      await isServerRunning("http://localhost:4096", { fetchImpl: fetchMock, ignoreInProcessFlag: true, ignoreCache: true })

      // then - should call fetch 4 times (2 attempts per call, 2 calls)
      expect(fetchMock.calls.length).toBe(4)
    })
  })

  test("uses different cache for different URLs", async () => {
    await runSerialServerHealthTest(async () => {
      // given
      const fetchMock = createFetchMock(async () => new Response(null, { status: 200 }))
      globalThis.fetch = fetchMock

      // when
      await isServerRunning("http://localhost:4096", { fetchImpl: fetchMock, ignoreInProcessFlag: true })
      await isServerRunning("http://localhost:5000", { fetchImpl: fetchMock, ignoreInProcessFlag: true })

      // then - should call fetch twice for different URLs
      expect(fetchMock.calls.length).toBe(2)
    })
  })
})

describe("resetServerCheck", () => {
  test("clears cache without throwing", async () => {
    // given, #when, #then
    expect(() => resetServerCheck()).not.toThrow()
  })

  test("allows re-checking after reset", async () => {
    await runSerialServerHealthTest(async () => {
      // given
      const originalFetch = globalThis.fetch
      const fetchMock = createFetchMock(async () => new Response(null, { status: 200 }))
      globalThis.fetch = fetchMock

      // when
      await isServerRunning("http://localhost:4096", { fetchImpl: fetchMock, ignoreInProcessFlag: true })
      resetServerCheck()
      await isServerRunning("http://localhost:4096", { fetchImpl: fetchMock, ignoreInProcessFlag: true })

      // then - should call fetch twice after reset
      expect(fetchMock.calls.length).toBe(2)

      // cleanup
      globalThis.fetch = originalFetch
    })
  })
})

describe("markServerRunningInProcess", () => {
  const originalFetch = globalThis.fetch
  const SERVER_RUNNING_KEY = Symbol.for("oh-my-opencode:server-running-in-process")

  beforeEach(() => {
    delete (globalThis as Record<symbol, boolean>)[SERVER_RUNNING_KEY]
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    delete (globalThis as Record<symbol, boolean>)[SERVER_RUNNING_KEY]
  })

  test("skips HTTP fetch when marked as running in-process", async () => {
    await runSerialServerHealthTest(async () => {
      // given
      const fetchMock = createFetchMock(async () => new Response(null, { status: 200 }))
      globalThis.fetch = fetchMock
      markServerRunningInProcess()

      // when
      const result = await isServerRunning("http://localhost:4096")

      // then
      expect(result).toBe(true)
      expect(fetchMock.calls.length).toBe(0)
    })
  })

  test("uses globalThis so flag survives across module instances", async () => {
    await runSerialServerHealthTest(async () => {
      // given
      markServerRunningInProcess()

      // when
      const flag = (globalThis as Record<symbol, boolean>)[SERVER_RUNNING_KEY]

      // then
      expect(flag).toBe(true)
    })
  })
})

describe("tmux pane functions", () => {
  test("spawnTmuxPane is exported as function", async () => {
    // given, #when
    const result = typeof spawnTmuxPane

    // then
    expect(result).toBe("function")
  })

  test("closeTmuxPane is exported as function", async () => {
    // given, #when
    const result = typeof closeTmuxPane

    // then
    expect(result).toBe("function")
  })

  test("applyLayout is exported as function", async () => {
    // given, #when
    const result = typeof applyLayout

    // then
    expect(result).toBe("function")
  })
})
