import { MD3DarkTheme, configureFonts } from "react-native-paper"

const fontConfig = configureFonts({ config: { fontFamily: "System" } })

export const twentyoneTheme = {
  ...MD3DarkTheme,
  fonts: fontConfig,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#3390EC",
    onPrimary: "#FFFFFF",
    primaryContainer: "#2B5278",
    onPrimaryContainer: "#E8F4FF",
    secondary: "#6AB2F2",
    background: "#0E1621",
    onBackground: "#F5F5F5",
    surface: "#17212B",
    onSurface: "#F5F5F5",
    surfaceVariant: "#232E3C",
    onSurfaceVariant: "#8B9BAB",
    outline: "#2F3B4A",
    error: "#E53935",
    elevation: {
      level0: "transparent",
      level1: "#17212B",
      level2: "#1C2733",
      level3: "#232E3C",
      level4: "#2A3542",
      level5: "#323D4A"
    }
  },
  roundness: 12
}

export const bubble = {
  outgoing: "#2B5278",
  incoming: "#182533",
  text: "#F5F5F5",
  muted: "#8B9BAB",
  accent: "#3390EC"
} as const
