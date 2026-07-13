import React, { useEffect, useRef } from "react"
import { StatusBar } from "react-native"
import { CommonActions, NavigationContainer, type NavigationContainerRef } from "@react-navigation/native"
import * as Notifications from "expo-notifications"
import { PaperProvider } from "react-native-paper"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { GatewayProvider } from "./context/GatewayContext"
import { AppNavigator, type RootStackParamList } from "./navigation/AppNavigator"
import { twentyoneTheme } from "./theme"

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true
  })
})

function openApprovalsTab(navigationRef: React.RefObject<NavigationContainerRef<RootStackParamList> | null>) {
  navigationRef.current?.dispatch(
    CommonActions.navigate({
      name: "Main",
      params: { screen: "Approvals" }
    })
  )
}

export default function App() {
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null)

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const screen = response.notification.request.content.data?.screen
      if (screen === "approvals") openApprovalsTab(navigationRef)
    })

    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response?.notification.request.content.data?.screen === "approvals") {
        openApprovalsTab(navigationRef)
      }
    })

    return () => subscription.remove()
  }, [])

  return (
    <SafeAreaProvider>
      <PaperProvider theme={twentyoneTheme}>
        <GatewayProvider>
          <StatusBar barStyle="light-content" backgroundColor="#0E1621" />
          <NavigationContainer ref={navigationRef}>
            <AppNavigator />
          </NavigationContainer>
        </GatewayProvider>
      </PaperProvider>
    </SafeAreaProvider>
  )
}
