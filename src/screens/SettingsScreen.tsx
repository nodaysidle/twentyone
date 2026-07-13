import React, { useState } from "react"
import { ScrollView, StyleSheet, View } from "react-native"
import { Appbar, Button, HelperText, Surface, Text, TextInput } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { QrPairingScanner } from "../components/QrPairingScanner"
import { useGateway } from "../context/GatewayContext"
import { resolveQrConnection } from "../lib/pairing"
import { bubble } from "../theme"

export function SettingsScreen({ onReconfigure }: { onReconfigure?: () => void }) {
  const {
    gatewayUrl,
    token,
    connected,
    loading,
    message,
    connection,
    setGatewayUrl,
    setToken,
    setOnboardingDone,
    refresh
  } = useGateway()
  const [localUrl, setLocalUrl] = useState(gatewayUrl)
  const [localToken, setLocalToken] = useState(token)
  const [scanning, setScanning] = useState(false)
  const [scanMessage, setScanMessage] = useState("")

  async function applyConnection(url: string, authToken: string) {
    const nextUrl = url.trim()
    const nextToken = authToken.trim()
    setLocalUrl(nextUrl)
    setLocalToken(nextToken)
    setGatewayUrl(nextUrl)
    setToken(nextToken)
    await refresh()
  }

  async function saveAndTest() {
    await applyConnection(localUrl, localToken)
  }

  async function handleQrScan(payload: string) {
    setScanMessage("")
    try {
      const resolved = await resolveQrConnection(payload)
      await applyConnection(resolved.gatewayUrl, resolved.token)
      setScanning(false)
    } catch (error) {
      setScanMessage(error instanceof Error ? error.message : "QR pairing failed.")
    }
  }

  function reopenOnboarding() {
    setOnboardingDone(false)
    onReconfigure?.()
  }

  if (scanning) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <QrPairingScanner
          onScan={handleQrScan}
          onClose={() => {
            setScanning(false)
            setScanMessage("")
          }}
          busy={loading}
          message={scanMessage}
        />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Appbar.Header style={styles.header} elevated={false}>
        <Appbar.Content title="Settings" titleStyle={styles.headerTitle} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleMedium" style={styles.section}>Cloudflare gateway</Text>

          <Button mode="contained" onPress={() => setScanning(true)}>
            Scan pairing QR
          </Button>

          <TextInput
            label="Gateway URL"
            value={localUrl}
            onChangeText={setLocalUrl}
            mode="outlined"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="https://….trycloudflare.com"
            style={styles.input}
          />

          <TextInput
            label="Remote token"
            value={localToken}
            onChangeText={setLocalToken}
            mode="outlined"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />

          <Button mode="outlined" onPress={saveAndTest} loading={loading}>
            Save & test
          </Button>

          <HelperText type={connected ? "info" : "error"} visible>
            {connected ? `Connected · ${connection}` : message}
          </HelperText>
        </Surface>

        <Surface style={styles.card} elevation={1}>
          <Text variant="titleMedium" style={styles.section}>Cloudflare quick tunnel</Text>
          <Text style={styles.help}>
            On your Mac, start the gateway then run scripts/twentyone-tunnel.sh. In nodaysgent desktop, open Remote Setup and create an Android pairing QR, or paste the https://….trycloudflare.com URL and token from ~/.agentpilot2/remote-token.
          </Text>
        </Surface>

        <Button mode="text" onPress={reopenOnboarding}>
          Re-run connection setup
        </Button>

        <Text style={styles.footer}>twentyone · package com.nodaysidle.agentpilot2.remote</Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0E1621" },
  header: { backgroundColor: "#17212B" },
  headerTitle: { color: bubble.text },
  page: { padding: 16, gap: 14, paddingBottom: 40 },
  card: { backgroundColor: "#17212B", borderRadius: 16, padding: 16, gap: 10 },
  section: { color: bubble.text },
  input: { backgroundColor: "#0E1621" },
  help: { color: bubble.muted, lineHeight: 21, fontSize: 14 },
  footer: { color: bubble.muted, textAlign: "center", fontSize: 12, marginTop: 8 }
})
