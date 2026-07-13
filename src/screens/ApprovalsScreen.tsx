import React from "react"
import { Platform, ScrollView, StyleSheet, View } from "react-native"
import { Appbar, Button, Card, Chip, Text } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { PlainTextOutput } from "../components/PlainTextOutput"
import { useGateway } from "../context/GatewayContext"
import { bubble } from "../theme"

function riskColor(risk: string) {
  switch (risk) {
    case "high":
      return "#E53935"
    case "medium":
      return "#FFB547"
    default:
      return bubble.accent
  }
}

export function ApprovalsScreen() {
  const { approvals, resolveApproval, connected, loading, refresh } = useGateway()

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Appbar.Header style={styles.header} elevated={false}>
        <Appbar.Content title="Approvals" subtitle={`${approvals.length} pending`} titleStyle={styles.headerTitle} />
        <Appbar.Action icon="refresh" onPress={() => refresh()} disabled={loading} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.page}>
        {!connected ? (
          <Text style={styles.offline}>Offline — reconnect in Settings.</Text>
        ) : null}

        {approvals.length === 0 ? (
          <View style={styles.empty}>
            <Text variant="headlineSmall" style={styles.emptyTitle}>All clear</Text>
            <Text variant="bodyMedium" style={styles.emptyBody}>
              When your agent needs permission, approval cards appear here.
            </Text>
          </View>
        ) : (
          approvals.map(approval => (
            <Card key={approval.id} style={[styles.card, approval.risk === "high" && styles.highRisk]} mode="elevated">
              <Card.Content style={styles.cardContent}>
                <Chip
                  compact
                  style={[styles.riskChip, { backgroundColor: `${riskColor(approval.risk)}22` }]}
                  textStyle={{ color: riskColor(approval.risk), fontWeight: "700" }}
                >
                  {approval.risk.toUpperCase()}
                </Chip>
                <PlainTextOutput value={approval.explanation} />
                <Text style={styles.meta}>{approval.permission.action}</Text>
                <Text style={styles.resource} numberOfLines={3}>{approval.permission.resource}</Text>
              </Card.Content>
              <Card.Actions style={styles.actions}>
                <Button mode="outlined" textColor={bubble.text} onPress={() => resolveApproval(approval.id, "deny")}>
                  Deny
                </Button>
                <Button mode="contained" buttonColor={bubble.accent} onPress={() => resolveApproval(approval.id, "approve")}>
                  Approve once
                </Button>
              </Card.Actions>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0E1621" },
  header: { backgroundColor: "#17212B" },
  headerTitle: { color: bubble.text },
  page: { padding: 16, gap: 14, paddingBottom: 32 },
  offline: { color: "#E53935", marginBottom: 8 },
  empty: { paddingTop: 48, alignItems: "center", gap: 8 },
  emptyTitle: { color: bubble.text },
  emptyBody: { color: bubble.muted, textAlign: "center", lineHeight: 22, paddingHorizontal: 24 },
  card: { backgroundColor: "#17212B", borderRadius: 16 },
  highRisk: { borderWidth: 1, borderColor: "#E5393555" },
  cardContent: { gap: 10 },
  riskChip: { alignSelf: "flex-start" },
  meta: { color: bubble.muted, fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  resource: { color: bubble.accent, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 13 },
  actions: { justifyContent: "flex-end", gap: 8, paddingHorizontal: 12, paddingBottom: 12 }
})
