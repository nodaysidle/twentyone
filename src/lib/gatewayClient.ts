export type Task = {
  id: string
  title: string
  prompt?: string
  intent?: string
  status: string
  providerRoute: string[]
  model?: string
  createdAt?: string
  updatedAt?: string
  messages?: Array<{ role: string; content?: string }>
}

export type Approval = {
  id: string
  taskId?: string
  explanation: string
  risk: "low" | "medium" | "high"
  status?: string
  permission: {
    action: string
    resource: string
    reason?: string
  }
  createdAt?: string
  expiresAt?: string
}

export type Skill = { id: string; title: string; triggers: string[]; path: string; body?: string; updatedAt?: string }
export type SkillStatus = { skills: Skill[]; sources: Array<{ path: string; exists: boolean; count: number }> }
export type MemoryState = { files: Record<"SOUL" | "USER" | "MEMORY", string>; status?: { directory: string; paths: Record<string, string> } }
export type ConnectionStatus = {
  status: string
  gateway: string
  urls?: { local: string; public: string }
  auth?: { localhostAllowed: boolean; remoteTokenConfigured: boolean; remoteTokenFingerprint?: string; deviceCount: number }
  modes?: Array<{ id: string; label: string; url: string }>
}

export type CronJob = { id: string; name: string; schedule: string; prompt?: string }

export function createGatewayClient(baseUrl: string, token = "") {
  const root = baseUrl.replace(/\/$/, "")
  const headers = (json = false) => ({
    ...(json ? { "content-type": "application/json" } : {}),
    ...(token.trim() ? { authorization: `Bearer ${token.trim()}` } : {})
  })

  async function getJson<T>(path: string): Promise<T> {
    const response = await fetch(`${root}${path}`, { headers: headers() })
    if (!response.ok) throw new Error(`Gateway request failed: ${response.status}`)
    return response.json() as Promise<T>
  }

  async function postJson<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${root}${path}`, {
      method: "POST",
      headers: headers(Boolean(body)),
      body: body ? JSON.stringify(body) : undefined
    })
    if (!response.ok) throw new Error(`Gateway request failed: ${response.status}`)
    return response.json() as Promise<T>
  }

  return {
    health: () => getJson<{ status: string }>("/health"),
    connectionStatus: () => getJson<ConnectionStatus>("/connection/status"),
    approvals: () => getJson<Approval[]>("/approvals"),
    tasks: () => getJson<Task[]>("/tasks"),
    task: (id: string) => getJson<{ task: Task; events: Array<{ id: string; type: string; summary: string; createdAt: string }> }>(`/tasks/${id}`),
    createTask: (prompt: string) => postJson<Task>("/tasks", { prompt, intent: "chat", providerId: "auto" }),
    resolveApproval: (id: string, decision: "approve" | "deny") => postJson<Approval>(`/approvals/${id}/${decision}`),
    cancelTask: (id: string) => postJson<Task>(`/tasks/${id}/cancel`),
    skills: () => getJson<SkillStatus>("/skills/status"),
    skill: (id: string) => getJson<Skill>(`/skills/${id}`),
    memory: () => getJson<MemoryState>("/memory"),
    appendMemory: (content: string) => postJson<{ content: string }>("/memory/MEMORY/append", { content }),
    cron: () => getJson<CronJob[]>("/cron"),
    eldioStatus: () => getJson<{
      status: string
      bridge: string
      config: { enabled: boolean; baseUrl: string; sessionKey: string }
      hermes: { ok?: boolean; reason?: string; platform?: string; version?: string }
    }>("/eldio/status"),
    eldioSlash: (input: string) => postJson<{ ok: boolean; text?: string; message?: string; sessionId?: string }>("/eldio/slash", { input }),
    eldioResetSession: () => postJson<{ reset: boolean; message: string }>("/eldio/reset-session")
  }
}
