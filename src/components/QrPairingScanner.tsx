import React, { useState } from "react"
import { StyleSheet, View } from "react-native"
import { CameraView, useCameraPermissions } from "expo-camera"
import { Button, HelperText, Text } from "react-native-paper"
import { bubble } from "../theme"

type QrPairingScannerProps = {
  onScan: (payload: string) => void
  onClose: () => void
  busy?: boolean
  message?: string
}

export function QrPairingScanner({ onScan, onClose, busy = false, message }: QrPairingScannerProps) {
  const [permission, requestPermission] = useCameraPermissions()
  const [scanned, setScanned] = useState(false)

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Checking camera permission…</Text>
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text variant="titleMedium" style={styles.title}>Camera access needed</Text>
        <Text style={styles.text}>Scan the pairing QR shown in nodaysgent desktop Remote Setup.</Text>
        <Button mode="contained" onPress={() => requestPermission()} style={styles.button}>
          Allow camera
        </Button>
        <Button mode="text" onPress={onClose}>Back</Button>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={({ data }) => {
          if (scanned || busy || !data?.trim()) return
          setScanned(true)
          onScan(data.trim())
        }}
      />
      <View style={styles.overlay}>
        <Text variant="titleMedium" style={styles.title}>Scan Mac pairing QR</Text>
        <Text style={styles.text}>Open nodaysgent desktop → Remote Setup → Create Android pairing token.</Text>
        {message ? <HelperText type="error" visible>{message}</HelperText> : null}
        <Button mode="text" onPress={onClose} disabled={busy}>Cancel</Button>
        {scanned ? (
          <Button mode="outlined" onPress={() => setScanned(false)} disabled={busy}>
            Scan again
          </Button>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0E1621" },
  camera: { flex: 1 },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    gap: 8,
    backgroundColor: "rgba(14, 22, 33, 0.92)"
  },
  title: { color: bubble.text },
  text: { color: bubble.muted, lineHeight: 20 },
  button: { marginTop: 8 }
})
