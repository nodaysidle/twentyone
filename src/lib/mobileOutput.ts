function stripInlineMarkdown(text: string): string {
  return text
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
}

function isTableSeparator(line: string): boolean {
  const trimmed = line.trim()
  return /^\|?\s*:?-{3,}:?/.test(trimmed.replace(/\|/g, " "))
}

function sanitizeProseLine(line: string): string | null {
  const trimmed = line.trim()
  if (!trimmed) return null
  if (isTableSeparator(trimmed)) return null

  if (/^#{1,6}\s+/.test(trimmed)) {
    return `• ${stripInlineMarkdown(trimmed.replace(/^#{1,6}\s+/, ""))}`
  }
  if (/^[-*]\s+/.test(trimmed)) {
    return `• ${stripInlineMarkdown(trimmed.replace(/^[-*]\s+/, ""))}`
  }
  if (/^\|/.test(trimmed) && trimmed.includes("|")) {
    const cells = trimmed
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map(part => part.trim())
      .filter(Boolean)
    if (cells.length >= 2) {
      const [label, ...rest] = cells
      return `• ${stripInlineMarkdown([label, rest.join(" — ")].filter(Boolean).join(": "))}`
    }
    return `• ${stripInlineMarkdown(cells.join(" · "))}`
  }
  if (/^>+\s?/.test(trimmed)) {
    return stripInlineMarkdown(trimmed.replace(/^>+\s?/, ""))
  }
  return stripInlineMarkdown(trimmed)
}

function sanitizeProseBlock(text: string): string {
  return text
    .split(/\r?\n/)
    .map(sanitizeProseLine)
    .filter((line): line is string => Boolean(line))
    .join("\n")
}

function indentCodeBlock(code: string): string {
  return code
    .split(/\r?\n/)
    .map(line => (line.length ? `  ${line}` : ""))
    .join("\n")
    .trimEnd()
}

/** Strip markdown-heavy formatting for mobile/Telegram-friendly plain text. */
export function sanitizeMobileOutput(text: string): string {
  const normalized = text.replace(/\r\n/g, "\n").trim()
  if (!normalized) return ""

  const parts: string[] = []
  const fence = /```[^\n]*\n([\s\S]*?)```/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = fence.exec(normalized)) !== null) {
    const before = normalized.slice(lastIndex, match.index)
    if (before.trim()) parts.push(sanitizeProseBlock(before))

    const code = match[1] ?? ""
    if (code.trim()) parts.push(indentCodeBlock(code))

    lastIndex = match.index + match[0].length
  }

  const tail = normalized.slice(lastIndex)
  if (tail.trim()) parts.push(sanitizeProseBlock(tail))

  return parts.join("\n\n").replace(/\n{3,}/g, "\n\n").trim()
}
