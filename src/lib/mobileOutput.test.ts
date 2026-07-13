import { describe, expect, it } from "vitest"
import { sanitizeMobileOutput } from "./mobileOutput"

describe("sanitizeMobileOutput", () => {
  it("converts markdown headers to bullets", () => {
    const input = "### Status\nAll good."
    expect(sanitizeMobileOutput(input)).toBe("• Status\nAll good.")
  })

  it("converts pipe tables to bullets and drops separators", () => {
    const input = [
      "| Step | Action |",
      "| --- | --- |",
      "| 1 | Read file |",
      "| 2 | Write patch |"
    ].join("\n")
    expect(sanitizeMobileOutput(input)).toBe(
      "• Step: Action\n• 1: Read file\n• 2: Write patch"
    )
  })

  it("normalizes list markers and strips inline markdown", () => {
    const input = "- **Bold** item\n* _italic_ [link](https://x.test)"
    expect(sanitizeMobileOutput(input)).toBe("• Bold item\n• italic link")
  })

  it("preserves fenced code blocks with indentation", () => {
    const input = "Run this:\n```bash\necho hi\nls\n```\nDone."
    expect(sanitizeMobileOutput(input)).toBe("Run this:\n\n  echo hi\n  ls\n\nDone.")
  })

  it("collapses excessive blank lines", () => {
    const input = "Line one\n\n\n\nLine two"
    expect(sanitizeMobileOutput(input)).toBe("Line one\nLine two")
  })
})
