import { describe, expect, it } from "vitest"
import { createGatewayClient } from "./gatewayClient"

describe("gateway client", () => {
  it("normalizes root URL", async () => {
    const client = createGatewayClient("http://127.0.0.1:3110/")
    expect(client).toHaveProperty("health")
  })

  it("creates tasks through the gateway API", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = []
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init })
      return new Response(JSON.stringify({
        id: "task_1",
        title: "Check status",
        status: "running",
        providerRoute: ["deepseek-v4-pro"]
      }), { status: 200, headers: { "content-type": "application/json" } })
    }) as typeof fetch

    try {
      const client = createGatewayClient("http://127.0.0.1:3110/")
      const task = await client.createTask("Check status")

      expect(task.id).toBe("task_1")
      expect(calls[0]?.url).toBe("http://127.0.0.1:3110/tasks")
      expect(calls[0]?.init?.method).toBe("POST")
      expect(JSON.parse(String(calls[0]?.init?.body))).toEqual({
        prompt: "Check status",
        intent: "chat",
        providerId: "auto"
      })
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it("sends approval decisions to the matching endpoint", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = []
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init })
      return new Response(JSON.stringify({
        id: "approval_1",
        explanation: "Approve shell command",
        risk: "medium",
        permission: { action: "shell.write", resource: "touch file" }
      }), { status: 200, headers: { "content-type": "application/json" } })
    }) as typeof fetch

    try {
      const client = createGatewayClient("http://127.0.0.1:3110")
      await client.resolveApproval("approval_1", "deny")

      expect(calls[0]?.url).toBe("http://127.0.0.1:3110/approvals/approval_1/deny")
      expect(calls[0]?.init?.method).toBe("POST")
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
