import { MD3DarkTheme, configureFonts } from "react-native-paper"

const fontConfig = configureFonts({ config: { fontFamily: "System" } })

export const twentyoneTheme = {
  ...MD3DarkTheme,
  fonts: fontConfig,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#C8FF00",
    onPrimary: "#0A0A0F",
    primaryContainer: "#1A2A00",
    onPrimaryContainer: "#C8FF00",
    secondary: "#7A9944",
    background: "#0A0A0F",
    onBackground: "#F0F0F5",
    surface: "#14141F",
    onSurface: "#F0F0F5",
    surfaceVariant: "#1E1E2A",
    onSurfaceVariant: "#6B6B80",
    outline: "#2A2A3C",
    error: "#E53935",
    elevation: {
      level0: "transparent",
      level1: "#14141F",
      level2: "#181825",
      level3: "#1C1C2A",
      level4: "#20202E",
      level5: "#242432"
    }
  },
  roundness: 12
}

export const bubble = {
  outgoing: "#1A2A00",
  incoming: "#14141F",
  text: "#F0F0F5",
  muted: "#6B6B80",
  accent: "#C8FF00"
} as const
