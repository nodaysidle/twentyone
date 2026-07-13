export type PairingQrPayload = {
  token: string
  gatewayUrl: string
  gatewayFingerprint: string
  expiresAt: string
}

export type DirectQrPayload = {
  gatewayUrl: string
  remoteToken?: string
  token?: string
}

export type ParsedQrConnection =
  | { kind: "pairing"; gatewayUrl: string; pairingToken: string; expiresAt: string }
  | { kind: "direct"; gatewayUrl: string; token: string }

export type ConfirmDeviceResult = {
  token: string
  device: { id: string; label: string; kind: string }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function readString(record: Record<string, unknown>, key: string) {
  const value = record[key]
  return typeof value === "string" ? value.trim() : ""
}

export function parseQrConnectionPayload(raw: string): ParsedQrConnection {
  const trimmed = raw.trim()
  if (!trimmed) throw new Error("Empty QR payload")

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    throw new Error("QR code is not valid twentyone pairing JSON")
  }

  if (!isRecord(parsed)) throw new Error("QR code is not valid twentyone pairing JSON")

  const gatewayUrl = readString(parsed, "gatewayUrl")
  if (!gatewayUrl) throw new Error("QR payload is missing gatewayUrl")

  const pairingToken = readString(parsed, "token")
  const gatewayFingerprint = readString(parsed, "gatewayFingerprint")
  const expiresAt = readString(parsed, "expiresAt")
  if (pairingToken && gatewayFingerprint && expiresAt) {
    return { kind: "pairing", gatewayUrl, pairingToken, expiresAt }
  }

  const directToken = readString(parsed, "remoteToken") || readString(parsed, "token")
  if (!directToken) throw new Error("QR payload is missing pairing token or remote token")

  return { kind: "direct", gatewayUrl, token: directToken }
}

export async function confirmDevicePairing(gatewayUrl: string, pairingToken: string): Promise<ConfirmDeviceResult> {
  const root = gatewayUrl.replace(/\/$/, "")
  const response = await fetch(`${root}/devices/confirm`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      pairingToken,
      label: "twentyone Android",
      kind: "android"
    })
  })

  if (!response.ok) {
    const body = await response.text().catch(() => "")
    throw new Error(body || `Pairing failed (${response.status})`)
  }

  return response.json() as Promise<ConfirmDeviceResult>
}

export async function resolveQrConnection(raw: string): Promise<{ gatewayUrl: string; token: string }> {
  const parsed = parseQrConnectionPayload(raw)
  if (parsed.kind === "direct") {
    return { gatewayUrl: parsed.gatewayUrl, token: parsed.token }
  }

  if (Date.parse(parsed.expiresAt) < Date.now()) {
    throw new Error("Pairing QR expired — create a new one on your Mac")
  }

  const confirmed = await confirmDevicePairing(parsed.gatewayUrl, parsed.pairingToken)
  return { gatewayUrl: parsed.gatewayUrl, token: confirmed.token }
}
