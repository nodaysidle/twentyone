import * as Notifications from "expo-notifications"

let configured = false

export async function notifyApproval(message: string) {
  if (!configured) {
    await Notifications.setNotificationChannelAsync("approvals", {
      name: "twentyone approvals",
      importance: Notifications.AndroidImportance.HIGH
    })
    configured = true
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "twentyone approval needed",
      body: message,
      data: { screen: "approvals" }
    },
    trigger: null
  })
}
