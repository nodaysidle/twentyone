# twentyone

[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Android-green.svg)](https://expo.dev)
[![Version](https://img.shields.io/badge/Version-0.1.0-blue.svg)](https://github.com/nodaysidle/twentyone/releases)

**twentyone** is the Android remote controller for [nodaysgent](https://github.com/nodaysidle) — a Telegram-style chat client that talks to your local Mac gateway over **Cloudflare quick tunnel**. Pair with a QR code, approve sensitive actions from your phone, and send slash commands without exposing your LAN.

> Proprietary software © NODAYSIDLE. See [LICENSE](LICENSE).

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

- **Onboarding:** Scan desktop **Remote Setup** QR → auto-fill tunnel URL + device token → connection test.
- **Chat:** Plain-text rendering (markdown sanitized for mobile).
- **Approvals:** Push-friendly inbox for gateway permission prompts.
- **Slash commands:** `/status`, `/eldio`, and extensible handlers when the Eldio bridge is enabled on the gateway.

Package: `com.nodaysidle.agentpilot2.remote` · display name: **twentyone**

## Install (release APK)

Download the latest **`app-release.apk`** from [GitHub Releases](https://github.com/nodaysidle/twentyone/releases).

```bash
adb install -r app-release.apk
```

Or sideload the APK on device. You need a running nodaysgent gateway with Cloudflare tunnel and a pairing QR from desktop **Remote Setup**.

## Prerequisites (Mac)

1. nodaysgent gateway listening (default `127.0.0.1:3110`).
2. Public URL via Cloudflare quick tunnel (or your own reverse proxy).
3. Desktop → **Remote Setup** → **Create Android pairing token** (~5 min TTL).

## Connect via QR

1. Open **twentyone** → **Scan pairing QR**.
2. Scan the JSON QR from desktop (contains `gatewayUrl`, pairing token, fingerprint, expiry).
3. App confirms via `POST {gatewayUrl}/devices/confirm` and stores the device token.
4. **Test connection** → **Continue to twentyone**.

Manual fallback: **Settings** → paste tunnel URL and remote/device token.

## Build from source

Requirements: Node 20+, Android SDK, JDK 17.

```bash
npm install
npm run assets          # regenerate icon/splash (optional)
npm run android:prebuild
npm run typecheck
npm run test
cd android && ./gradlew assembleRelease
```

Release APK: `android/app/build/outputs/apk/release/app-release.apk`

## Development

```bash
npm run dev               # Expo dev client
npm run android:device    # Run on connected device
```

USB `adb reverse` against localhost is for dev builds only; the release app is **Cloudflare-only**.

## Security

- Device tokens live in **Expo Secure Store** on the phone.
- Sensitive gateway tools still require explicit approval; denials are recorded on the task timeline.
- Do not commit tunnel URLs, pairing tokens, or `remote-token` file contents.

## Related

- nodaysgent monorepo (gateway + desktop): private / separate release track.
- Tag **`twentyone-v0.1.0`** marks the first public Android ship.

## License

Proprietary — NODAYSIDLE. All rights reserved. See [LICENSE](LICENSE).
