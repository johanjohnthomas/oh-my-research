import { afterEach, describe, expect, it } from "bun:test"
import { applyLayout } from "./layout"

const spawnCalls: string[][] = []
function spawnMock(args: string[]) {
  spawnCalls.push(args)
  return { exited: Promise.resolve(0) }
}

describe("applyLayout", () => {
  afterEach(() => {
    spawnCalls.length = 0
  })

  it("applies main-vertical with main-pane-width option", async () => {
    await applyLayout("tmux", "main-vertical", 60, { spawnCommand: spawnMock })

    expect(spawnCalls).toEqual([
      ["tmux", "select-layout", "main-vertical"],
      ["tmux", "set-window-option", "main-pane-width", "60%"],
    ])
  })

  it("applies main-horizontal with main-pane-height option", async () => {
    await applyLayout("tmux", "main-horizontal", 55, { spawnCommand: spawnMock })

    expect(spawnCalls).toEqual([
      ["tmux", "select-layout", "main-horizontal"],
      ["tmux", "set-window-option", "main-pane-height", "55%"],
    ])
  })

  it("does not set main pane option for non-main layouts", async () => {
    await applyLayout("tmux", "tiled", 50, { spawnCommand: spawnMock })

    expect(spawnCalls).toEqual([["tmux", "select-layout", "tiled"]])
  })
})
