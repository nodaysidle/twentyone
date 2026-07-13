import { describe, expect, it } from "vitest"
import { parseQrConnectionPayload } from "./pairing"

describe("pairing QR parsing", () => {
  it("parses desktop pairing payloads", () => {
    const payload = JSON.stringify({
      token: "pairing-token-value",
      gatewayUrl: "https://abc.trycloudflare.com",
      gatewayFingerprint: "deadbeef",
      expiresAt: new Date(Date.now() + 60_000).toISOString()
    })

    expect(parseQrConnectionPayload(payload)).toEqual({
      kind: "pairing",
      gatewayUrl: "https://abc.trycloudflare.com",
      pairingToken: "pairing-token-value",
      expiresAt: expect.any(String)
    })
  })

  it("parses direct cloudflare url + remote token payloads", () => {
    const payload = JSON.stringify({
      gatewayUrl: "https://abc.trycloudflare.com",
      remoteToken: "remote-token-value"
    })

    expect(parseQrConnectionPayload(payload)).toEqual({
      kind: "direct",
      gatewayUrl: "https://abc.trycloudflare.com",
      token: "remote-token-value"
    })
  })
})
