/**
 * Eldio/Hermes slash command registry for twentyone mobile.
 * Mirrors gateway-visible commands from hermes_cli/commands.py COMMAND_REGISTRY.
 */

export type SlashCommandDef = {
  name: string
  description: string
  category: string
  aliases?: string[]
  argsHint?: string
  subcommands?: string[]
  gatewayOnly?: boolean
  cliOnly?: boolean
}

export const SLASH_COMMAND_REGISTRY: SlashCommandDef[] = [
  // Session
  { name: "start", description: "Acknowledge platform start pings without a reply", category: "Session", gatewayOnly: true },
  { name: "new", description: "Start a new session (fresh session ID + history)", category: "Session", aliases: ["reset"], argsHint: "[name]" },
  { name: "topic", description: "Enable or inspect Telegram DM topic sessions", category: "Session", gatewayOnly: true, argsHint: "[off|help|session-id]" },
  { name: "retry", description: "Retry the last message (resend to agent)", category: "Session" },
  { name: "undo", description: "Back up N user turns and re-prompt (default 1)", category: "Session", argsHint: "[N]" },
  { name: "title", description: "Set a title for the current session", category: "Session", argsHint: "[name]" },
  { name: "branch", description: "Branch the current session (explore a different path)", category: "Session", aliases: ["fork"], argsHint: "[name]" },
  { name: "compress", description: "Compress conversation context", category: "Session", argsHint: "[here [N] | focus topic]" },
  { name: "rollback", description: "List or restore filesystem checkpoints", category: "Session", argsHint: "[number]" },
  { name: "stop", description: "Kill all running background processes", category: "Session" },
  { name: "approve", description: "Approve a pending dangerous command", category: "Session", gatewayOnly: true, argsHint: "[session|always]" },
  { name: "deny", description: "Deny a pending dangerous command", category: "Session", gatewayOnly: true },
  { name: "background", description: "Run a prompt in the background", category: "Session", aliases: ["bg", "btw"], argsHint: "<prompt>" },
  { name: "agents", description: "Show active agents and running tasks", category: "Session", aliases: ["tasks"] },
  { name: "queue", description: "Queue a prompt for the next turn (doesn't interrupt)", category: "Session", aliases: ["q"], argsHint: "<prompt>" },
  { name: "steer", description: "Inject a message after the next tool call without interrupting", category: "Session", argsHint: "<prompt>" },
  {
    name: "goal",
    description: "Set a standing goal the agent works on across turns until achieved",
    category: "Session",
    argsHint: "[text | draft <text> | show | pause | resume | clear | status | wait <pid> | unwait]",
    subcommands: ["draft", "show", "pause", "resume", "clear", "status", "wait", "unwait"]
  },
  { name: "moa", description: "Run one prompt through Mixture of Agents preset", category: "Session", argsHint: "<prompt>" },
  { name: "subgoal", description: "Add or manage extra criteria on the active goal", category: "Session", argsHint: "[text | remove N | clear]", subcommands: ["remove", "clear"] },
  { name: "status", description: "Show session, model, token, and context info", category: "Session" },
  { name: "sethome", description: "Set this chat as the home channel", category: "Session", gatewayOnly: true, aliases: ["set-home"] },
  { name: "resume", description: "Resume a previously-named session", category: "Session", argsHint: "[name]" },
  { name: "sessions", description: "Browse and resume previous sessions", category: "Session" },
  { name: "restart", description: "Gracefully restart the gateway after draining active runs", category: "Session", gatewayOnly: true },

  // Configuration
  { name: "model", description: "Switch model (persists by default)", category: "Configuration", argsHint: "[model] [--provider name]" },
  { name: "codex-runtime", description: "Toggle codex app-server runtime for OpenAI/Codex models", category: "Configuration", aliases: ["codex_runtime"], argsHint: "[auto|codex_app_server]" },
  { name: "personality", description: "Set a predefined personality", category: "Configuration", argsHint: "[name]" },
  { name: "verbose", description: "Cycle tool progress display", category: "Configuration", cliOnly: true },
  { name: "footer", description: "Toggle gateway runtime-metadata footer on final replies", category: "Configuration", argsHint: "[on|off|status]", subcommands: ["on", "off", "status"] },
  { name: "yolo", description: "Toggle YOLO mode (skip dangerous command approvals)", category: "Configuration" },
  {
    name: "reasoning",
    description: "Manage reasoning effort and display",
    category: "Configuration",
    argsHint: "[level|show|hide|full|clamp]",
    subcommands: ["none", "minimal", "low", "medium", "high", "xhigh", "show", "hide", "on", "off", "full", "clamp"]
  },
  { name: "fast", description: "Toggle fast mode — priority processing", category: "Configuration", argsHint: "[normal|fast|status]", subcommands: ["normal", "fast", "status", "on", "off"] },
  { name: "voice", description: "Toggle voice mode", category: "Configuration", argsHint: "[on|off|tts|status]", subcommands: ["on", "off", "tts", "status"] },

  // Tools & Skills
  { name: "skills", description: "Search, install, inspect, or manage skills", category: "Tools & Skills", cliOnly: true },
  {
    name: "memory",
    description: "Review pending memory writes / toggle the approval gate",
    category: "Tools & Skills",
    argsHint: "[pending|approve|reject|approval] [id|on|off]",
    subcommands: ["pending", "approve", "reject", "approval"]
  },
  { name: "bundles", description: "List skill bundles", category: "Tools & Skills" },
  { name: "learn", description: "Learn a reusable skill from dirs, URLs, chat, or notes", category: "Tools & Skills", argsHint: "<what to learn from>" },
  {
    name: "suggestions",
    description: "Review suggested automations (accept/dismiss)",
    category: "Tools & Skills",
    aliases: ["suggest"],
    argsHint: "[accept|dismiss N | catalog]",
    subcommands: ["accept", "dismiss", "catalog", "clear"]
  },
  { name: "blueprint", description: "Set up an automation from a blueprint template", category: "Tools & Skills", aliases: ["bp"], argsHint: "[name] [slot=value ...]" },
  {
    name: "curator",
    description: "Background skill maintenance",
    category: "Tools & Skills",
    subcommands: ["status", "run", "pause", "resume", "pin", "unpin", "restore", "list-archived"]
  },
  {
    name: "kanban",
    description: "Multi-profile collaboration board",
    category: "Tools & Skills",
    subcommands: ["init", "boards", "create", "list", "ls", "show", "assign", "stats", "dispatch"]
  },
  { name: "reload-mcp", description: "Reload MCP servers from config", category: "Tools & Skills", aliases: ["reload_mcp"] },
  { name: "reload-skills", description: "Re-scan skills directory", category: "Tools & Skills", aliases: ["reload_skills"] },
  { name: "cron", description: "Manage scheduled tasks", category: "Tools & Skills", cliOnly: true, subcommands: ["list", "add", "create", "edit", "pause", "resume", "run", "remove"] },

  // Info
  { name: "commands", description: "Browse all commands and skills (paginated)", category: "Info", gatewayOnly: true, argsHint: "[page]" },
  { name: "help", description: "Show available commands", category: "Info" },
  { name: "whoami", description: "Show your slash command access (admin / user)", category: "Info" },
  { name: "profile", description: "Show active profile name and home directory", category: "Info" },
  { name: "usage", description: "Show token usage and rate limits for the current session", category: "Info" },
  { name: "credits", description: "Show Nous credit balance and top up", category: "Info" },
  { name: "insights", description: "Show usage insights and analytics", category: "Info", argsHint: "[days]" },
  { name: "platform", description: "Pause, resume, or list a failing gateway platform", category: "Info", gatewayOnly: true, argsHint: "<pause|resume|list> [name]", subcommands: ["pause", "resume", "list"] },
  { name: "update", description: "Update agent to the latest version", category: "Info" },
  { name: "version", description: "Show agent version", category: "Info", aliases: ["v"] },
  { name: "debug", description: "Upload debug report and get shareable links", category: "Info", argsHint: "[nous|local]" }
]

const lookup = new Map<string, SlashCommandDef>()

for (const cmd of SLASH_COMMAND_REGISTRY) {
  lookup.set(cmd.name, cmd)
  for (const alias of cmd.aliases ?? []) lookup.set(alias, cmd)
}

export function resolveSlashCommand(name: string): SlashCommandDef | undefined {
  return lookup.get(name.toLowerCase().replace(/^\//, ""))
}

export function allSlashCommands(): SlashCommandDef[] {
  return SLASH_COMMAND_REGISTRY
}

export function formatCommandLabel(cmd: SlashCommandDef) {
  return `/${cmd.name}`
}

export function formatCommandUsage(cmd: SlashCommandDef) {
  const hint = cmd.argsHint ? ` ${cmd.argsHint}` : ""
  return `/${cmd.name}${hint}`
}

export type ParsedSlashInput = {
  command: SlashCommandDef
  subcommand?: string
  args: string
  raw: string
}

export function parseSlashInput(text: string): ParsedSlashInput | null {
  const trimmed = text.trim()
  if (!trimmed.startsWith("/")) return null
  const body = trimmed.slice(1)
  const [head, ...restParts] = body.split(/\s+/)
  const cmd = resolveSlashCommand(head)
  if (!cmd) return null
  const rest = restParts.join(" ").trim()
  const firstWord = restParts[0]?.toLowerCase()
  const subcommand = firstWord && cmd.subcommands?.includes(firstWord) ? firstWord : undefined
  const args = subcommand ? restParts.slice(1).join(" ").trim() : rest
  return { command: cmd, subcommand, args, raw: trimmed }
}

export function slashQueryFromPrompt(prompt: string) {
  if (!prompt.startsWith("/")) return null
  const withoutSlash = prompt.slice(1)
  const space = withoutSlash.indexOf(" ")
  if (space >= 0) {
    const head = withoutSlash.slice(0, space)
    const tail = withoutSlash.slice(space + 1)
    const cmd = resolveSlashCommand(head)
    if (!cmd) return { mode: "command" as const, query: head.toLowerCase() }
    if (cmd.subcommands?.length && !tail.includes(" ")) {
      return { mode: "subcommand" as const, command: cmd, query: tail.toLowerCase() }
    }
    return null
  }
  return { mode: "command" as const, query: withoutSlash.toLowerCase() }
}

export function filterSlashCommands(query: string) {
  const q = query.toLowerCase()
  return SLASH_COMMAND_REGISTRY.filter(cmd => {
    if (cmd.name.startsWith(q)) return true
    return cmd.aliases?.some(alias => alias.startsWith(q))
  }).slice(0, 12)
}

export function filterSubcommands(cmd: SlashCommandDef, query: string) {
  const q = query.toLowerCase()
  return (cmd.subcommands ?? []).filter(sub => sub.startsWith(q)).slice(0, 8)
}

export function helpText(page = 1) {
  const pageSize = 12
  const start = (page - 1) * pageSize
  const slice = SLASH_COMMAND_REGISTRY.slice(start, start + pageSize)
  const lines = slice.map(cmd => `${formatCommandUsage(cmd)}\n  ${cmd.description}`)
  const totalPages = Math.ceil(SLASH_COMMAND_REGISTRY.length / pageSize)
  return [`twentyone commands (page ${page}/${totalPages})`, "", ...lines].join("\n")
}
