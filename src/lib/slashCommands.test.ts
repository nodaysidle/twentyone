import { describe, expect, it } from "vitest"
import { filterSlashCommands, parseSlashInput, resolveSlashCommand, slashQueryFromPrompt } from "./slashCommands"

describe("slashCommands", () => {
  it("resolves core Eldio commands", () => {
    expect(resolveSlashCommand("goal")?.name).toBe("goal")
    expect(resolveSlashCommand("reset")?.name).toBe("new")
    expect(resolveSlashCommand("/status")?.name).toBe("status")
  })

  it("parses /status", () => {
    const parsed = parseSlashInput("/status")
    expect(parsed?.command.name).toBe("status")
    expect(parsed?.args).toBe("")
  })

  it("parses goal subcommands", () => {
    const parsed = parseSlashInput("/goal status")
    expect(parsed?.command.name).toBe("goal")
    expect(parsed?.subcommand).toBe("status")
  })

  it("filters autocomplete by prefix", () => {
    const matches = filterSlashCommands("go")
    expect(matches.some(cmd => cmd.name === "goal")).toBe(true)
  })

  it("detects slash query mode", () => {
    expect(slashQueryFromPrompt("/hel")?.mode).toBe("command")
    expect(slashQueryFromPrompt("/goal st")?.mode).toBe("subcommand")
  })
})
