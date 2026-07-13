import type { Approval, Task } from "./gatewayClient"
import { createGatewayClient } from "./gatewayClient"
import { helpText, parseSlashInput } from "./slashCommands"

export type SlashCommandAction =
  | { type: "message"; text: string }
  | { type: "task"; prompt: string }
  | { type: "navigate"; screen: "approvals" | "settings" }
  | { type: "clear_chat"; text: string }

export type SlashHandlerContext = {
  client: ReturnType<typeof createGatewayClient>
  connected: boolean
  mode: string
  gatewayUrl: string
  tasks: Task[]
  approvals: Approval[]
  activeTask?: Task
  cancelActiveTask: () => Promise<void>
  refresh: () => Promise<void>
  goalState?: { text: string; paused: boolean }
  setGoalState?: (next: { text: string; paused: boolean } | undefined) => void
  lastUserPrompt?: string
}

const HERMES_PROXY_COMMANDS = new Set([
  "usage", "credits", "insights", "billing", "model", "personality", "reasoning", "fast", "yolo",
  "footer", "voice", "codex-runtime", "topic", "sethome", "restart", "platform", "kanban", "curator",
  "blueprint", "suggestions", "reload-mcp", "reload-skills", "undo", "title", "branch", "compress",
  "rollback", "resume", "update", "debug", "bundles", "sessions", "agents", "memory"
])

async function proxyEldioSlash(input: string, ctx: SlashHandlerContext): Promise<SlashCommandAction> {
  try {
    const result = await ctx.client.eldioSlash(input)
    const text = result.text || result.message
    return { type: "message", text: text || "Eldio returned an empty response." }
  } catch (error) {
    return {
      type: "message",
      text: error instanceof Error ? error.message : "Eldio slash command failed."
    }
  }
}


function taskStatusLines(tasks: Task[], activeTask?: Task) {
  const recent = tasks.slice(0, 5)
  const lines = [
    `Gateway: connected`,
    `Active: ${activeTask ? `${activeTask.title || activeTask.id} (${activeTask.status})` : "idle"}`,
    `Recent tasks: ${recent.length}`,
    ...recent.map(task => `• ${task.title || task.id} — ${task.status}`)
  ]
  return lines.join("\n")
}

export async function executeSlashCommand(input: string, ctx: SlashHandlerContext): Promise<SlashCommandAction> {
  const parsed = parseSlashInput(input)
  if (!parsed) {
    return { type: "message", text: "Unknown command. Type /help for the Eldio-compatible command list." }
  }

  const { command: cmd, subcommand, args } = parsed
  const name = cmd.name

  if (!ctx.connected && !["help", "commands", "version", "whoami", "profile", "status"].includes(name)) {
    return { type: "message", text: "Gateway offline. Connect in Settings before running commands." }
  }

  switch (name) {
    case "start":
      return { type: "message", text: "twentyone ready." }

    case "new":
    case "reset":
      await ctx.client.eldioResetSession().catch(() => undefined)
      ctx.setGoalState?.(undefined)
      return {
        type: "clear_chat",
        text: args ? `New Eldio session: ${args}` : "New Eldio session started. Chat cleared; next message continues on Hermes."
      }

    case "help":
      return { type: "message", text: helpText(Number(args) || 1) }

    case "commands": {
      const page = Number(args) || 1
      return { type: "message", text: helpText(page) }
    }

    case "status": {
      try {
        const [health, connection, eldio] = await Promise.all([
          ctx.client.health().catch(() => ({ status: "unreachable" })),
          ctx.client.connectionStatus().catch(() => null),
          ctx.client.eldioStatus().catch(() => null)
        ])
        const goal = ctx.goalState
        const lines = [
          `twentyone status`,
          `Gateway: ${health.status}`,
          `Eldio bridge: ${eldio?.config?.enabled ? (eldio.status === "ok" ? "connected" : "degraded") : "disabled"}`,
          eldio?.config?.enabled ? `Hermes: ${eldio.hermes?.platform ?? "hermes-agent"} ${eldio.hermes?.version ?? ""}`.trim() : "",
          `Name: ${connection?.gateway ?? "twentyone"}`,
          `Mode: Cloudflare`,
          `URL: ${ctx.gatewayUrl}`,
          `Remote token: ${connection?.auth?.remoteTokenConfigured ? "configured" : "not required (USB)"}`,
          taskStatusLines(ctx.tasks, ctx.activeTask),
          goal ? `Goal: ${goal.paused ? "paused" : "active"} — ${goal.text.slice(0, 120)}` : "Goal: none"
        ].filter(Boolean)
        return { type: "message", text: lines.join("\n") }
      } catch (error) {
        return {
          type: "message",
          text: error instanceof Error ? error.message : "Failed to fetch gateway status."
        }
      }
    }

    case "whoami":
      return {
        type: "message",
        text: [
          "twentyone remote controller",
          "Access: admin (full slash commands)",
          `Connection: Cloudflare`,
          "Plain chat and approvals enabled."
        ].join("\n")
      }

    case "profile": {
      const eldio = await ctx.client.eldioStatus().catch(() => null)
      return {
        type: "message",
        text: [
          "Profile: Eldio (Hermes captain)",
          `Bridge: ${eldio?.config?.enabled ? "enabled" : "disabled"}`,
          `Session key: ${eldio?.config?.sessionKey ?? "twentyone"}`,
          `Gateway: twentyone @ ${ctx.gatewayUrl}`
        ].join("\n")
      }
    }

    case "version":
      return { type: "message", text: "twentyone mobile 0.1.0\nBackend: Eldio via Hermes api_server bridge" }

    case "stop":
      if (!ctx.activeTask) return { type: "message", text: "No active task to stop." }
      await ctx.cancelActiveTask()
      return { type: "message", text: `Stopped task ${ctx.activeTask.id}.` }

    case "approve":
      if (!ctx.approvals.length) return { type: "message", text: "No pending approvals." }
      return { type: "navigate", screen: "approvals" }

    case "deny":
      if (!ctx.approvals.length) return { type: "message", text: "No pending approvals." }
      return { type: "navigate", screen: "approvals" }

    case "agents":
    case "tasks":
    case "sessions":
      return { type: "message", text: taskStatusLines(ctx.tasks, ctx.activeTask) }

    case "retry":
      if (!ctx.lastUserPrompt) return { type: "message", text: "Nothing to retry yet." }
      return { type: "task", prompt: ctx.lastUserPrompt }

    case "background":
    case "bg":
    case "btw":
      if (!args) return { type: "message", text: "Usage: /background <prompt>" }
      return { type: "task", prompt: `[background] ${args}` }

    case "queue":
    case "q":
      if (!args) return { type: "message", text: "Usage: /queue <prompt>" }
      return { type: "task", prompt: `[queued] ${args}` }

    case "steer":
      if (!args) return { type: "message", text: "Usage: /steer <prompt>" }
      return { type: "task", prompt: `[steer] ${args}` }

    case "moa":
      if (!args) return { type: "message", text: "Usage: /moa <prompt>" }
      return { type: "task", prompt: `[moa] ${args}` }

    case "learn":
      if (!args) return { type: "message", text: "Usage: /learn <what to learn from>" }
      return { type: "task", prompt: `Learn a reusable skill from: ${args}` }

    case "goal": {
      if (!subcommand && !args) {
        const goal = ctx.goalState
        if (!goal) return { type: "message", text: "No active goal. Use /goal <contract> to set one." }
        return {
          type: "message",
          text: [`Goal (${goal.paused ? "paused" : "active"}):`, goal.text].join("\n")
        }
      }
      if (subcommand === "status" || subcommand === "show") {
        const goal = ctx.goalState
        if (!goal) return { type: "message", text: "No active goal." }
        return { type: "message", text: [`Goal (${goal.paused ? "paused" : "active"}):`, goal.text].join("\n") }
      }
      if (subcommand === "pause") {
        if (!ctx.goalState) return { type: "message", text: "No active goal to pause." }
        ctx.setGoalState?.({ ...ctx.goalState, paused: true })
        return { type: "message", text: "Goal paused." }
      }
      if (subcommand === "resume") {
        if (!ctx.goalState) return { type: "message", text: "No paused goal." }
        ctx.setGoalState?.({ ...ctx.goalState, paused: false })
        return { type: "message", text: "Goal resumed." }
      }
      if (subcommand === "clear") {
        ctx.setGoalState?.(undefined)
        return { type: "message", text: "Goal cleared." }
      }
      const text = subcommand === "draft" ? args : [subcommand, args].filter(Boolean).join(" ")
      if (!text) return { type: "message", text: "Usage: /goal <contract text>" }
      ctx.setGoalState?.({ text, paused: false })
      return { type: "task", prompt: `[goal loop] Pursue this goal until verifiably done:\n\n${text}` }
    }

    case "subgoal":
      if (!ctx.goalState) return { type: "message", text: "No active goal. Set one with /goal first." }
      if (subcommand === "clear") {
        return { type: "message", text: "Subgoals cleared (main goal kept)." }
      }
      if (!args && subcommand !== "remove") return { type: "message", text: "Usage: /subgoal <text>" }
      return { type: "task", prompt: `[subgoal for active goal] ${args}` }

    case "memory": {
      if (subcommand === "pending" || subcommand === "approval" || subcommand === "approve" || subcommand === "reject") {
        return proxyEldioSlash(input, ctx)
      }
      const memory = await ctx.client.memory()
      const preview = memory.files.MEMORY?.slice(0, 1500) || "MEMORY.md is empty."
      return {
        type: "message",
        text: [`Memory directory: ${memory.status?.directory ?? "unknown"}`, "", preview].join("\n")
      }
    }

    case "skills": {
      if (args || subcommand) return proxyEldioSlash(input, ctx)
      const skills = await ctx.client.skills()
      const lines = skills.skills.slice(0, 20).map(skill => `• ${skill.title} — ${skill.triggers.slice(0, 3).join(", ")}`)
      return { type: "message", text: [`Skills (${skills.skills.length}):`, ...lines].join("\n") }
    }

    case "bundles":
    case "cron":
    case "usage":
    case "credits":
    case "insights":
    case "billing":
    case "model":
    case "personality":
    case "reasoning":
    case "fast":
    case "yolo":
    case "footer":
    case "voice":
    case "codex-runtime":
    case "verbose":
    case "topic":
    case "sethome":
    case "restart":
    case "platform":
    case "kanban":
    case "curator":
    case "blueprint":
    case "suggestions":
    case "reload-mcp":
    case "reload-skills":
    case "undo":
    case "title":
    case "branch":
    case "compress":
    case "rollback":
    case "resume":
    case "update":
    case "debug":
      return proxyEldioSlash(input, ctx)

    default:
      if (HERMES_PROXY_COMMANDS.has(name)) return proxyEldioSlash(input, ctx)
      return { type: "message", text: `Unknown command /${name}. Try /help.` }
  }
}
