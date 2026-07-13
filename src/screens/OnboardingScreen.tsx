import React, { useState } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native"
import { Button, HelperText, Surface, Text, TextInput } from "react-native-paper"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { QrPairingScanner } from "../components/QrPairingScanner"
import { useGateway } from "../context/GatewayContext"
import { resolveQrConnection } from "../lib/pairing"
import { bubble } from "../theme"

export function OnboardingScreen({ onContinue }: { onContinue: () => void }) {
  const insets = useSafeAreaInsets()
  const {
    gatewayUrl,
    token,
    connected,
    loading,
    message,
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

  async function handleConnect() {
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

  function handleContinue() {
    setOnboardingDone(true)
    onContinue()
  }

  if (scanning) {
    return (
      <View style={[styles.safe, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <QrPairingScanner
          onScan={handleQrScan}
          onClose={() => {
            setScanning(false)
            setScanMessage("")
          }}
          busy={loading}
          message={scanMessage}
        />
      </View>
    )
  }

  return (
    <View style={[styles.safe, { paddingTop: insets.top, paddingBottom: insets.bottom + 8 }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
          <Text variant="labelLarge" style={styles.brand}>twentyone</Text>
          <Text variant="headlineMedium" style={styles.title}>Connect your Mac</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Scan the Cloudflare pairing QR from nodaysgent desktop, or paste your tunnel URL and token manually.
          </Text>

          <Surface style={styles.card} elevation={1}>
            <Button mode="contained" onPress={() => setScanning(true)} style={styles.button}>
              Scan pairing QR
            </Button>
            <HelperText type="info" visible style={styles.helper}>
              Desktop → Remote Setup → Create Android pairing token. QR includes your trycloudflare.com URL.
            </HelperText>

            <Text variant="titleSmall" style={styles.section}>Or enter manually</Text>

            <TextInput
              label="Cloudflare gateway URL"
              value={localUrl}
              onChangeText={setLocalUrl}
              mode="outlined"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="https://….trycloudflare.com"
              style={styles.input}
              outlineColor={bubble.muted}
              activeOutlineColor={bubble.accent}
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
              outlineColor={bubble.muted}
              activeOutlineColor={bubble.accent}
            />

            <Button mode="outlined" onPress={handleConnect} loading={loading} style={styles.button}>
              Test connection
            </Button>

            <HelperText type={connected ? "info" : "error"} visible>
              {connected ? "Connected — you're ready." : message}
            </HelperText>
          </Surface>

          <Button mode="text" onPress={handleContinue} disabled={!connected}>
            Continue to twentyone
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0E1621" },
  flex: { flex: 1 },
  page: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, gap: 14 },
  brand: { color: bubble.accent, letterSpacing: 2, textTransform: "lowercase" },
  title: { color: bubble.text, fontWeight: "700" },
  subtitle: { color: bubble.muted, lineHeight: 22 },
  card: { backgroundColor: "#17212B", borderRadius: 16, padding: 16, gap: 8 },
  section: { color: bubble.text, marginTop: 4 },
  input: { backgroundColor: "#0E1621" },
  button: { marginTop: 4 },
  helper: { color: bubble.muted }
})
