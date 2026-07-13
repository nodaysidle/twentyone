import React from "react"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useGateway } from "../context/GatewayContext"
import { ApprovalsScreen } from "../screens/ApprovalsScreen"
import { ChatScreen } from "../screens/ChatScreen"
import { OnboardingScreen } from "../screens/OnboardingScreen"
import { SettingsScreen } from "../screens/SettingsScreen"
import { bubble } from "../theme"

export type RootStackParamList = {
  Onboarding: undefined
  Main: { screen?: keyof MainTabParamList } | undefined
}

export type MainTabParamList = {
  Chat: undefined
  Approvals: undefined
  Settings: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator<MainTabParamList>()

function MainTabs({ onReconfigure }: { onReconfigure: () => void }) {
  const { approvals } = useGateway()
  const insets = useSafeAreaInsets()
  const tabBarHeight = 48 + insets.bottom

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: "#17212B",
          borderTopColor: "#2F3B4A",
          height: tabBarHeight,
          paddingBottom: insets.bottom + 2,
          paddingTop: 4
        },
        tabBarActiveTintColor: bubble.accent,
        tabBarInactiveTintColor: bubble.muted
      }}
    >
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="message-text-outline" color={color} size={size} />
        }}
      />
      <Tab.Screen
        name="Approvals"
        component={ApprovalsScreen}
        options={{
          tabBarBadge: approvals.length > 0 ? approvals.length : undefined,
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="shield-check-outline" color={color} size={size} />
        }}
      />
      <Tab.Screen
        name="Settings"
        options={{
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="cog-outline" color={color} size={size} />
        }}
      >
        {() => <SettingsScreen onReconfigure={onReconfigure} />}
      </Tab.Screen>
    </Tab.Navigator>
  )
}

export function AppNavigator() {
  const { onboardingDone, setOnboardingDone } = useGateway()

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={onboardingDone ? "Main" : "Onboarding"}>
      <Stack.Screen name="Onboarding">
        {({ navigation }) => (
          <OnboardingScreen
            onContinue={() => {
              setOnboardingDone(true)
              navigation.replace("Main")
            }}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Main">
        {({ navigation }) => (
          <MainTabs
            onReconfigure={() => {
              setOnboardingDone(false)
              navigation.replace("Onboarding")
            }}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  )
}
