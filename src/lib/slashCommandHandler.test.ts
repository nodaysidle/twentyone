import { describe, expect, it, vi } from "vitest"
import { executeSlashCommand } from "./slashCommandHandler"
import type { SlashHandlerContext } from "./slashCommandHandler"

function mockContext(overrides: Partial<SlashHandlerContext> = {}): SlashHandlerContext {
  return {
    client: {
      health: vi.fn().mockResolvedValue({ status: "ok" }),
      connectionStatus: vi.fn().mockResolvedValue({
        gateway: "twentyone",
        auth: { remoteTokenConfigured: true }
      }),
      eldioStatus: vi.fn().mockResolvedValue({
        status: "ok",
        config: { enabled: true, baseUrl: "http://127.0.0.1:8648", sessionKey: "twentyone" },
        hermes: { platform: "hermes-agent", version: "0.18.0" }
      }),
      eldioSlash: vi.fn(),
      eldioResetSession: vi.fn(),
      memory: vi.fn(),
      skills: vi.fn()
    } as unknown as SlashHandlerContext["client"],
    connected: true,
    mode: "cloudflare",
    gatewayUrl: "https://example.trycloudflare.com",
    tasks: [],
    approvals: [],
    cancelActiveTask: vi.fn(),
    refresh: vi.fn(),
    ...overrides
  }
}

describe("executeSlashCommand", () => {
  it("returns help locally without gateway calls", async () => {
    const ctx = mockContext({ connected: false })
    const result = await executeSlashCommand("/help", ctx)
    expect(result.type).toBe("message")
    expect(result.type === "message" && result.text).toContain("twentyone commands")
    expect(ctx.client.health).not.toHaveBeenCalled()
  })

  it("builds /status from gateway endpoints", async () => {
    const ctx = mockContext()
    const result = await executeSlashCommand("/status", ctx)
    expect(result.type).toBe("message")
    expect(result.type === "message" && result.text).toContain("twentyone status")
    expect(result.type === "message" && result.text).toContain("Gateway: ok")
    expect(ctx.client.health).toHaveBeenCalled()
    expect(ctx.client.eldioStatus).toHaveBeenCalled()
  })

  it("returns unknown command message for unrecognized slash input", async () => {
    const ctx = mockContext()
    const result = await executeSlashCommand("/not-a-real-command", ctx)
    expect(result.type).toBe("message")
    expect(result.type === "message" && result.text).toContain("Unknown command")
  })
})
