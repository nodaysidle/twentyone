import React from "react"
import { StyleSheet, Text, View } from "react-native"
import { sanitizeMobileOutput } from "../lib/mobileOutput"
import { bubble } from "../theme"

export function plainTextFromMarkdown(value: string) {
  return sanitizeMobileOutput(value)
}

type PlainTextOutputProps = {
  value: string
  compact?: boolean
}

export function PlainTextOutput({ value, compact = false }: PlainTextOutputProps) {
  const lines = plainTextFromMarkdown(value).split("\n").filter(Boolean)

  return (
    <View style={styles.block}>
      {lines.map((line, index) => (
        <Text key={`${index}-${line.slice(0, 12)}`} style={[styles.line, compact && styles.compact]}>
          {line}
        </Text>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  block: { gap: 4 },
  line: { color: bubble.text, fontSize: 15, lineHeight: 22 },
  compact: { fontSize: 14, lineHeight: 20 }
})
