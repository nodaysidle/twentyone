import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import * as SecureStore from "expo-secure-store"
import { createGatewayClient, type Approval, type Task } from "../lib/gatewayClient"
import { executeSlashCommand, type SlashCommandAction } from "../lib/slashCommandHandler"
import { notifyApproval } from "../notifications/approvalNotifications"

const DEFAULT_GATEWAY = ""
const URL_KEY = "nodaysgent.gatewayUrl"
const TOKEN_KEY = "nodaysgent.gatewayToken"
const ONBOARDING_KEY = "twentyone.onboardingDone"
const GOAL_KEY = "twentyone.goalState"

export type LocalChatMessage = {
  id: string
  role: "user" | "assistant" | "status"
  text: string
}

export type GoalState = { text: string; paused: boolean }

export type ConnectionMode = "cloudflare"

type GatewayContextValue = {
  gatewayUrl: string
  token: string
  mode: ConnectionMode
  connected: boolean
  loading: boolean
  submitting: boolean
  message: string
  connection: string
  approvals: Approval[]
  tasks: Task[]
  localMessages: LocalChatMessage[]
  goalState?: GoalState
  lastUserPrompt: string
  onboardingDone: boolean
  setGatewayUrl: (url: string) => void
  setToken: (token: string) => void
  setOnboardingDone: (done: boolean) => void
  refresh: (options?: { notify?: boolean }) => Promise<void>
  createTask: (prompt: string, options?: { skipUserMessage?: boolean }) => Promise<void>
  runSlashCommand: (input: string) => Promise<SlashCommandAction | null>
  clearLocalChat: () => void
  resolveApproval: (id: string, decision: "approve" | "deny") => Promise<void>
  cancelActiveTask: () => Promise<void>
  activeTask: Task | undefined
}

const GatewayContext = createContext<GatewayContextValue | null>(null)

function isActive(task: Task) {
  return task.status === "running" || task.status === "queued" || task.status === "waiting_approval"
}

function latestAssistantText(task: Task) {
  return [...(task.messages ?? [])]
    .reverse()
    .find(message => message.role === "assistant" && message.content?.trim())
    ?.content?.trim()
}

export function GatewayProvider({ children }: { children: React.ReactNode }) {
  const [gatewayUrl, setGatewayUrlState] = useState(DEFAULT_GATEWAY)
  const [token, setTokenState] = useState("")
  const mode: ConnectionMode = "cloudflare"
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState("Connect to your Mac gateway to begin.")
  const [connection, setConnection] = useState("Not checked")
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [localMessages, setLocalMessages] = useState<LocalChatMessage[]>([])
  const [goalState, setGoalState] = useState<GoalState | undefined>(undefined)
  const [lastUserPrompt, setLastUserPrompt] = useState("")
  const [onboardingDone, setOnboardingDoneState] = useState(false)
  const lastApprovalId = useRef<string | null>(null)

  const client = useMemo(() => createGatewayClient(gatewayUrl, token), [gatewayUrl, token])
  const activeTask = tasks.find(isActive)

  const setGatewayUrl = useCallback((url: string) => setGatewayUrlState(url), [])
  const setToken = useCallback((value: string) => setTokenState(value), [])
  const setOnboardingDone = useCallback((done: boolean) => {
    setOnboardingDoneState(done)
    SecureStore.setItemAsync(ONBOARDING_KEY, done ? "1" : "0").catch(() => undefined)
  }, [])

  useEffect(() => {
    SecureStore.getItemAsync(URL_KEY).then(value => value && setGatewayUrlState(value)).catch(() => undefined)
    SecureStore.getItemAsync(TOKEN_KEY).then(value => value && setTokenState(value)).catch(() => undefined)
    SecureStore.getItemAsync(ONBOARDING_KEY).then(value => setOnboardingDoneState(value === "1")).catch(() => undefined)
    SecureStore.getItemAsync(GOAL_KEY).then(value => {
      if (!value) return
      try {
        const parsed = JSON.parse(value) as GoalState
        if (parsed?.text) setGoalState(parsed)
      } catch {
        return
      }
    }).catch(() => undefined)
  }, [])

  useEffect(() => {
    if (!goalState) {
      SecureStore.deleteItemAsync(GOAL_KEY).catch(() => undefined)
      return
    }
    SecureStore.setItemAsync(GOAL_KEY, JSON.stringify(goalState)).catch(() => undefined)
  }, [goalState])

  useEffect(() => {
    SecureStore.setItemAsync(URL_KEY, gatewayUrl).catch(() => undefined)
  }, [gatewayUrl])

  useEffect(() => {
    SecureStore.setItemAsync(TOKEN_KEY, token).catch(() => undefined)
  }, [token])

  const refresh = useCallback(async ({ notify = false } = {}) => {
    if (!gatewayUrl.trim()) {
      setConnected(false)
      setMessage("Add your Cloudflare gateway URL to connect.")
      return
    }

    setLoading(true)
    try {
      const health = await client.health()
      const isConnected = health.status === "ok"
      setConnected(isConnected)
      if (!isConnected) throw new Error("Gateway health is not ok")

      const [approvalList, taskList, connectionState] = await Promise.all([
        client.approvals(),
        client.tasks(),
        client.connectionStatus().catch(() => null)
      ])

      setApprovals(approvalList)
      setTasks(taskList)
      setConnection(connectionState?.auth?.remoteTokenConfigured ? "Cloudflare · remote token configured" : "Cloudflare tunnel")
      setMessage(
        approvalList.length
          ? `${approvalList.length} approval${approvalList.length === 1 ? "" : "s"} waiting.`
          : "Connected to twentyone."
      )

      const newest = approvalList[0]
      if (notify && newest && newest.id !== lastApprovalId.current) {
        lastApprovalId.current = newest.id
        await notifyApproval(newest.explanation)
      }
    } catch (error) {
      setConnected(false)
      setMessage(error instanceof Error ? error.message : "Gateway connection failed.")
    } finally {
      setLoading(false)
    }
  }, [client, gatewayUrl])

  useEffect(() => {
    refresh({ notify: true }).catch(() => undefined)

    const fast = approvals.length > 0 || Boolean(activeTask)
    const intervalMs = connected ? (fast ? 5000 : 15000) : 20000

    const interval = setInterval(() => {
      refresh({ notify: true }).catch(() => undefined)
    }, intervalMs)

    return () => clearInterval(interval)
  }, [client, connected, approvals.length, activeTask?.id, refresh])

  const pollTaskUntilSettled = useCallback(async (taskId: string) => {
    const deadline = Date.now() + 120_000
    while (Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      try {
        const detail = await client.task(taskId)
        const next = detail.task
        setTasks(current => current.map(item => (item.id === taskId ? { ...item, ...next } : item)))
        if (next.status === "done" || next.status === "failed" || next.status === "cancelled") {
          await refresh()
          return
        }
        if (next.status !== "running" && next.status !== "queued" && next.status !== "waiting_approval") {
          return
        }
      } catch {
        return
      }
    }
  }, [client, refresh])

  const appendLocalMessage = useCallback((role: LocalChatMessage["role"], text: string) => {
    setLocalMessages(current => [...current, { id: `${Date.now()}-${current.length}`, role, text }])
  }, [])

  const clearLocalChat = useCallback(() => {
    setLocalMessages([])
  }, [])

  const createTask = useCallback(async (prompt: string, options?: { skipUserMessage?: boolean }) => {
    const text = prompt.trim()
    if (!text || submitting || !connected) return
    setLastUserPrompt(text)
    if (!options?.skipUserMessage) appendLocalMessage("user", text)
    setSubmitting(true)
    try {
      const task = await client.createTask(text)
      setTasks(current => [task, ...current.filter(item => item.id !== task.id)])
      setMessage(`Task started: ${task.title || task.id}`)
      await refresh()
      void pollTaskUntilSettled(task.id)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Task creation failed.")
    } finally {
      setSubmitting(false)
    }
  }, [appendLocalMessage, client, connected, pollTaskUntilSettled, refresh, submitting])

  const cancelActiveTask = useCallback(async () => {
    if (!activeTask) {
      setMessage("No active task to stop.")
      return
    }
    try {
      await client.cancelTask(activeTask.id)
      setMessage("Emergency stop sent.")
      await refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Stop request failed.")
    }
  }, [activeTask, client, refresh])

  const runSlashCommand = useCallback(async (input: string) => {
    const text = input.trim()
    if (!text.startsWith("/")) return null
    appendLocalMessage("user", text)
    try {
      const result = await executeSlashCommand(text, {
        client,
        connected,
        mode,
        gatewayUrl,
        tasks,
        approvals,
        activeTask,
        cancelActiveTask,
        refresh,
        goalState,
        setGoalState,
        lastUserPrompt
      })

      if (result.type === "message") appendLocalMessage("assistant", result.text)
      if (result.type === "clear_chat") {
        clearLocalChat()
        appendLocalMessage("assistant", result.text)
      }
      if (result.type === "task") {
        await createTask(result.prompt, { skipUserMessage: true })
      }
      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : "Slash command failed."
      appendLocalMessage("assistant", message)
      return { type: "message", text: message } satisfies SlashCommandAction
    }
  }, [
    appendLocalMessage,
    approvals,
    activeTask,
    cancelActiveTask,
    clearLocalChat,
    client,
    connected,
    createTask,
    gatewayUrl,
    goalState,
    lastUserPrompt,
    mode,
    refresh,
    tasks
  ])

  const resolveApproval = useCallback(async (id: string, decision: "approve" | "deny") => {
    try {
      await client.resolveApproval(id, decision)
      setMessage(decision === "approve" ? "Approved from twentyone." : "Denied from twentyone.")
      await refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Approval request failed.")
    }
  }, [client, refresh])

  const value = useMemo<GatewayContextValue>(() => ({
    gatewayUrl,
    token,
    mode,
    connected,
    loading,
    submitting,
    message,
    connection,
    approvals,
    tasks,
    localMessages,
    goalState,
    lastUserPrompt,
    onboardingDone,
    setGatewayUrl,
    setToken,
    setOnboardingDone,
    refresh,
    createTask,
    runSlashCommand,
    clearLocalChat,
    resolveApproval,
    cancelActiveTask,
    activeTask
  }), [
    gatewayUrl,
    token,
    mode,
    connected,
    loading,
    submitting,
    message,
    connection,
    approvals,
    tasks,
    localMessages,
    goalState,
    lastUserPrompt,
    onboardingDone,
    setGatewayUrl,
    setToken,
    setOnboardingDone,
    refresh,
    createTask,
    runSlashCommand,
    clearLocalChat,
    resolveApproval,
    cancelActiveTask,
    activeTask
  ])

  return <GatewayContext.Provider value={value}>{children}</GatewayContext.Provider>
}

export function useGateway() {
  const context = useContext(GatewayContext)
  if (!context) throw new Error("useGateway must be used within GatewayProvider")
  return context
}

export function latestTaskReply(task: Task) {
  return latestAssistantText(task)
}
