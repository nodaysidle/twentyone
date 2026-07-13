import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { FlatList, Platform, StyleSheet, View } from "react-native"
import { useFocusEffect, useNavigation } from "@react-navigation/native"
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs"
import { FAB, IconButton, Surface, Text, TextInput } from "react-native-paper"
import { AvoidSoftInput, AvoidSoftInputView } from "react-native-avoid-softinput"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { PlainTextOutput } from "../components/PlainTextOutput"
import { SlashCommandMenu } from "../components/SlashCommandMenu"
import { latestTaskReply, useGateway } from "../context/GatewayContext"
import type { MainTabParamList } from "../navigation/AppNavigator"
import { bubble } from "../theme"

type ChatItem = {
  id: string
  role: "user" | "assistant" | "status"
  text: string
  status?: string
}

const HEADER_HEIGHT = 40

export function ChatScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>()
  const {
    tasks,
    localMessages,
    connected,
    submitting,
    createTask,
    runSlashCommand,
    cancelActiveTask,
    activeTask,
    message
  } = useGateway()
  const [prompt, setPrompt] = useState("")
  const listRef = useRef<FlatList<ChatItem>>(null)
  const insets = useSafeAreaInsets()
  const showSlashMenu = prompt.startsWith("/") && !prompt.includes("\n")
  const trimmedPrompt = prompt.trim()
  const isSlashPrompt = trimmedPrompt.startsWith("/")

  const items = useMemo<ChatItem[]>(() => {
    const rows: ChatItem[] = []
    const [newest, ...older] = tasks
    for (const task of [...older].reverse().slice(-11)) {
      const userText = task.prompt || task.title
      if (userText && !rows.some(row => row.role === "user" && row.text === userText)) {
        rows.push({ id: `${task.id}-user`, role: "user", text: userText })
      }
      const reply = latestTaskReply(task)
      if (reply) rows.push({ id: `${task.id}-assistant`, role: "assistant", text: reply })
      rows.push({
        id: `${task.id}-status`,
        role: "status",
        text: task.status,
        status: task.status
      })
    }

    rows.push(...localMessages)

    if (newest) {
      const userText = newest.prompt || newest.title
      const hasLocalUser = userText
        ? localMessages.some(message => message.role === "user" && message.text.trim() === userText.trim())
        : false
      if (userText && !hasLocalUser) {
        rows.push({ id: `${newest.id}-user`, role: "user", text: userText })
      }
      const reply = latestTaskReply(newest)
      if (reply) rows.push({ id: `${newest.id}-assistant`, role: "assistant", text: reply })
      rows.push({
        id: `${newest.id}-status`,
        role: "status",
        text: newest.status,
        status: newest.status
      })
    }

    return rows
  }, [localMessages, tasks])

  function scrollToBottom() {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }))
  }

  useEffect(() => {
    if (items.length) scrollToBottom()
  }, [items.length])

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return
      AvoidSoftInput.setEnabled(true)
      AvoidSoftInput.setAdjustPan()
      AvoidSoftInput.setShouldMimicIOSBehavior(true)
      return () => {
        AvoidSoftInput.setEnabled(false)
        AvoidSoftInput.setDefaultAppSoftInputMode()
      }
    }, [])
  )

  const handleSoftInputShown = useCallback(() => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }))
  }, [])

  async function send() {
    const text = prompt.trim()
    if (!text) return
    const slash = text.startsWith("/")
    if (!slash && (!connected || submitting)) return
    setPrompt("")

    if (slash) {
      const result = await runSlashCommand(text)
      if (result?.type === "navigate" && result.screen === "approvals") {
        navigation.navigate("Approvals")
      }
      scrollToBottom()
      return
    }

    await createTask(text)
  }

  return (
    <AvoidSoftInputView style={styles.flex} showAnimationDelay={0} onSoftInputShown={handleSoftInputShown}>
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>twentyone</Text>
            <Text style={styles.subtitle}>{connected ? "online" : "offline"}</Text>
          </View>
          {activeTask ? (
            <IconButton icon="stop-circle-outline" iconColor={bubble.accent} size={22} onPress={cancelActiveTask} />
          ) : null}
        </View>

        <FlatList
          ref={listRef}
          data={items}
          keyExtractor={item => item.id}
          style={styles.flex}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          onContentSizeChange={scrollToBottom}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text variant="titleMedium" style={styles.emptyTitle}>No messages yet</Text>
              <Text variant="bodyMedium" style={styles.emptyBody}>
                Send a prompt or type / for Eldio-compatible slash commands.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            if (item.role === "status") {
              return <Text style={styles.status}>{item.text}</Text>
            }
            const outgoing = item.role === "user"
            return (
              <View style={[styles.row, outgoing ? styles.rowOutgoing : styles.rowIncoming]}>
                <Surface style={[styles.bubble, outgoing ? styles.bubbleOutgoing : styles.bubbleIncoming]} elevation={0}>
                  {outgoing ? (
                    <Text style={styles.bubbleText}>{item.text}</Text>
                  ) : (
                    <PlainTextOutput value={item.text} />
                  )}
                </Surface>
              </View>
            )
          }}
        />

        <View style={styles.footer}>
          <SlashCommandMenu
            prompt={prompt}
            visible={showSlashMenu}
            variant="inline"
            onSelect={value => setPrompt(value)}
          />

          <View style={styles.composer}>
            <TextInput
              value={prompt}
              onChangeText={setPrompt}
              placeholder="Message or /command…"
              placeholderTextColor={bubble.muted}
              mode="flat"
              multiline
              style={styles.input}
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              dense
              onFocus={scrollToBottom}
            />
            <FAB
              icon="send"
              size="small"
              style={styles.send}
              onPress={send}
              disabled={!trimmedPrompt || (!connected && !isSlashPrompt) || (submitting && !isSlashPrompt)}
              loading={submitting}
            />
          </View>
          {!connected ? <Text style={styles.banner}>{message}</Text> : null}
        </View>
      </View>
    </AvoidSoftInputView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0E1621" },
  flex: { flex: 1 },
  header: {
    height: HEADER_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    backgroundColor: "#17212B"
  },
  headerText: { gap: 0 },
  title: { color: bubble.text, fontSize: 16, fontWeight: "700", lineHeight: 18 },
  subtitle: { color: bubble.muted, fontSize: 11, lineHeight: 13 },
  list: { padding: 12, gap: 8, flexGrow: 1, paddingBottom: 8 },
  row: { marginVertical: 4 },
  rowOutgoing: { alignItems: "flex-end" },
  rowIncoming: { alignItems: "flex-start" },
  bubble: { maxWidth: "88%", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleOutgoing: { backgroundColor: bubble.outgoing, borderBottomRightRadius: 4 },
  bubbleIncoming: { backgroundColor: bubble.incoming, borderBottomLeftRadius: 4 },
  bubbleText: { color: bubble.text, fontSize: 15, lineHeight: 22 },
  status: { alignSelf: "center", color: bubble.muted, fontSize: 12, marginVertical: 2 },
  footer: {
    backgroundColor: "#17212B",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#2F3B4A"
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 6
  },
  input: { flex: 1, backgroundColor: "#232E3C", borderRadius: 20, maxHeight: 120, minHeight: 40 },
  send: { backgroundColor: bubble.accent, marginBottom: 2 },
  banner: { color: "#E53935", textAlign: "center", paddingBottom: 4, fontSize: 12 },
  empty: { padding: 32, alignItems: "center", gap: 8 },
  emptyTitle: { color: bubble.text },
  emptyBody: { color: bubble.muted, textAlign: "center", lineHeight: 22 }
})
