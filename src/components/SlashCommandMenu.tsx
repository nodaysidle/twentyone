import React, { useMemo } from "react"
import { FlatList, Pressable, StyleSheet, View } from "react-native"
import { Surface, Text } from "react-native-paper"
import {
  filterSlashCommands,
  filterSubcommands,
  formatCommandLabel,
  type SlashCommandDef,
  slashQueryFromPrompt
} from "../lib/slashCommands"
import { bubble } from "../theme"

type SlashCommandMenuProps = {
  prompt: string
  visible: boolean
  variant?: "floating" | "inline"
  bottomOffset?: number
  onSelect: (value: string) => void
}

type MenuItem = {
  key: string
  label: string
  description: string
  value: string
}

function buildItems(prompt: string): MenuItem[] {
  const query = slashQueryFromPrompt(prompt)
  if (!query) return []

  if (query.mode === "subcommand") {
    return filterSubcommands(query.command, query.query).map(sub => ({
      key: `${query.command.name}-${sub}`,
      label: `/${query.command.name} ${sub}`,
      description: query.command.description,
      value: `/${query.command.name} ${sub} `
    }))
  }

  return filterSlashCommands(query.query).map((cmd: SlashCommandDef) => ({
    key: cmd.name,
    label: formatCommandLabel(cmd),
    description: cmd.description,
    value: `/${cmd.name}${cmd.subcommands?.length ? " " : ""}`
  }))
}

export function SlashCommandMenu({
  prompt,
  visible,
  variant = "floating",
  bottomOffset = 72,
  onSelect
}: SlashCommandMenuProps) {
  const items = useMemo(() => buildItems(prompt), [prompt])
  if (!visible || !items.length) return null

  const menuStyle = variant === "inline" ? styles.menuInline : [styles.menuFloating, { bottom: bottomOffset }]

  return (
    <Surface style={menuStyle} elevation={2}>
      <FlatList
        data={items}
        keyExtractor={item => item.key}
        keyboardShouldPersistTaps="always"
        style={styles.list}
        renderItem={({ item }) => (
          <Pressable onPress={() => onSelect(item.value)} style={styles.row}>
            <View style={styles.rowBody}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
            </View>
          </Pressable>
        )}
      />
    </Surface>
  )
}

const styles = StyleSheet.create({
  menuFloating: {
    position: "absolute",
    left: 12,
    right: 12,
    maxHeight: 260,
    backgroundColor: "#17212B",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#2F3B4A",
    overflow: "hidden"
  },
  menuInline: {
    marginHorizontal: 12,
    marginTop: 8,
    maxHeight: 220,
    backgroundColor: "#17212B",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#2F3B4A",
    overflow: "hidden"
  },
  list: { flexGrow: 0 },
  row: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#232E3C"
  },
  rowBody: { gap: 2 },
  label: { color: bubble.accent, fontWeight: "700", fontSize: 15 },
  description: { color: bubble.muted, fontSize: 13, lineHeight: 18 }
})
