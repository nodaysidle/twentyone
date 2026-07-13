# twentyone

> Android remote controller for nodaysgent — chat with your local Mac gateway, approve sensitive actions, and send slash commands over a Cloudflare tunnel.

![Platform](https://img.shields.io/badge/platform-Android-green?style=flat-square&logo=android)
![Version](https://img.shields.io/badge/version-0.1.0-blue?style=flat-square)
![License](https://img.shields.io/badge/license-Proprietary-red?style=flat-square)

## Overview

**twentyone** is the Android companion for [nodaysgent](https://github.com/nodaysidle/nodaysgent) — a Telegram-style client that connects to your local Mac gateway over HTTPS. Pair once with a desktop QR code, then chat, review approvals, and run slash commands without exposing your LAN.

Package: `com.nodaysidle.agentpilot2.remote` · Display name: **twentyone**

## Features

- **QR pairing** — scan desktop Remote Setup QR; app confirms via `/devices/confirm` and stores the device token
- **Cloudflare tunnel** — release builds connect through a public HTTPS URL (no USB/LAN onboarding)
- **Chat** — send prompts to the gateway; plain-text output with mobile-safe sanitization
- **Approvals inbox** — badge-counted tab for permission prompts from sensitive gateway tools
- **Slash commands** — `/status`, `/eldio`, and extensible handlers when the Eldio bridge is enabled
- **Secure storage** — device tokens in Expo Secure Store

## Requirements

**Mac (gateway host)**

- [nodaysgent](https://github.com/nodaysidle/nodaysgent) gateway running (default `127.0.0.1:3110`)
- Public URL via Cloudflare quick tunnel or your own reverse proxy
- Desktop → **Remote Setup** → **Create Android pairing token** (~5 min TTL)

**Android device**

- Android with camera (for QR pairing)
- Sideload or adb install permission for release APK

**Build from source**

- Node.js 20+
- Android SDK
- JDK 17

## Install

1. Download `app-release.apk` from [GitHub Releases](https://github.com/nodaysidle/twentyone/releases/tag/twentyone-v0.1.0)
   - SHA256: `c184b14726aa787ca5350de73477f3de795e676e100fdbc0703fbe58244a749a`
2. Sideload on your Android device, or install via adb:

```bash
adb install -r app-release.apk
```

You need a running nodaysgent gateway with Cloudflare tunnel and a pairing QR from desktop **Remote Setup**.

## Connect (QR)

1. Open **twentyone** → **Scan pairing QR**
2. Scan the JSON QR from desktop (contains `gatewayUrl`, pairing token, fingerprint, expiry)
3. App confirms via `POST {gatewayUrl}/devices/confirm` and stores the device token
4. Tap **Test connection** → **Continue to twentyone**

**Manual fallback:** Settings → paste tunnel URL and device token.

## Usage

| Tab | Purpose |
|-----|---------|
| **Chat** | Send tasks and messages to the gateway; view responses |
| **Approvals** | Approve or deny sensitive tool requests from the gateway |
| **Settings** | View connection status, re-pair, or update gateway URL |

**Slash commands** (when connected):

- `/status` — gateway and task summary
- `/eldio …` — proxy to Eldio bridge (when enabled on the gateway)
- Type `/` in chat to open the command menu

Do not commit tunnel URLs, pairing tokens, or device credentials.

## Architecture

```text
┌─────────────┐     HTTPS (trycloudflare)      ┌──────────────────┐
│  twentyone  │ ◄──────────────────────────► │  nodaysgent      │
│  (Android)  │   REST + WebSocket timeline  │  gateway (Mac)   │
└─────────────┘                              └──────────────────┘
       │                                              │
       │  QR pairing → POST /devices/confirm          │
       └──────────────────────────────────────────────┘
```

| Area | Technology |
|------|------------|
| Mobile | Expo 54, React Native |
| Transport | HTTPS (Cloudflare quick tunnel) |
| Pairing | QR → `POST /devices/confirm` |
| Credentials | Expo Secure Store |
| Gateway | nodaysgent local API + WebSocket timeline |

## Build

```bash
npm install
npm run assets          # regenerate icon/splash (optional)
npm run android:prebuild
npm run typecheck
npm run test
cd android && ./gradlew assembleRelease
```

Release APK: `android/app/build/outputs/apk/release/app-release.apk`

**Development**

```bash
npm run dev               # Expo dev client
npm run android:device    # Run on connected device
```

USB `adb reverse` against localhost is for dev builds only; release builds are Cloudflare-only.

## Status

**v0.1.0** — first public Android release ([twentyone-v0.1.0](https://github.com/nodaysidle/twentyone/releases/tag/twentyone-v0.1.0)).

Active development alongside [nodaysgent](https://github.com/nodaysidle/nodaysgent).

## License

Proprietary — NODAYSIDLE. All rights reserved. See [LICENSE](LICENSE).
