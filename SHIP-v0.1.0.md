# twentyone v0.1.0 — ship receipt

**Date:** 2026-07-13  
**Version:** 0.1.0  
**Package:** `com.nodaysidle.agentpilot2.remote`  
**Display name:** twentyone

## Artifact

| Field | Value |
|-------|-------|
| APK path | `apps/mobile/android/app/build/outputs/apk/release/app-release.apk` |
| Size | 82 MB |
| SHA256 | `c184b14726aa787ca5350de73477f3de795e676e100fdbc0703fbe58244a749a` |

## Install

```bash
adb -s <device-serial> install -r apps/mobile/android/app/build/outputs/apk/release/app-release.apk
```

**Install status (2026-07-13):** Success on device `<device-serial>`.

## What shipped

- **QR pairing:** Scan desktop Remote Setup QR → `/devices/confirm` → auto-fill Cloudflare URL + device token → test connection.
- **Cloudflare-only UI:** USB/LAN modes removed from onboarding and settings (adb reverse scripts remain in repo for dev).
- **Icon:** Dark void `#0E1621` with silver metallic **21** (icon, adaptive-icon, splash, notification-icon).
- **expo-camera** for Android QR scan (CAMERA permission in manifest).

## User test checklist

- [ ] Open twentyone → onboarding shows **Scan pairing QR** (no USB/LAN chips).
- [ ] On Mac: nodaysgent desktop → Remote Setup → **Create Android pairing token**.
- [ ] Scan QR on phone → URL + token auto-filled → **Test connection** succeeds.
- [ ] Continue to chat; send a message; gateway responds.
- [ ] Trigger an approval on Mac; approve/deny from **Approvals** tab.
- [ ] `/status` and `/eldio` slash commands work when Eldio bridge is enabled.
- [ ] App icon shows silver **21** on dark background.

## QR flow (user steps)

1. Ensure Mac gateway + Cloudflare tunnel are running (`pnpm twentyone:verify` or manual tunnel).
2. Desktop → **Remote Setup** → **Create Android pairing token** (valid ~5 minutes).
3. Phone → twentyone onboarding → **Scan pairing QR**.
4. Point camera at QR (JSON with `gatewayUrl`, `token`, `gatewayFingerprint`, `expiresAt`).
5. App calls `POST {gatewayUrl}/devices/confirm` and stores returned device token.
6. Connection test runs automatically; tap **Continue to twentyone**.

Manual fallback: paste `https://….trycloudflare.com` and `~/.agentpilot2/remote-token` in Settings.

## Verification run

```bash
pnpm --filter @agentpilot2/mobile typecheck   # pass
pnpm --filter @agentpilot2/mobile test        # 9 tests pass
cd apps/mobile/android && ./gradlew assembleRelease  # BUILD SUCCESSFUL
```

Gateway / Eldio bridge: unchanged in this release (mobile-only diff).

## GitHub mirror

Pushed to https://github.com/nodaysidle/twentyone. If tagging releases, tag `twentyone-v0.1.0` and attach this APK + SHA256 to the release notes.

## Files changed (mobile v0.1)

- `apps/mobile/src/lib/pairing.ts` — QR parse + `/devices/confirm`
- `apps/mobile/src/lib/pairing.test.ts`
- `apps/mobile/src/components/QrPairingScanner.tsx`
- `apps/mobile/src/screens/OnboardingScreen.tsx`
- `apps/mobile/src/screens/SettingsScreen.tsx`
- `apps/mobile/src/context/GatewayContext.tsx`
- `apps/mobile/src/lib/slashCommandHandler.ts`
- `apps/mobile/scripts/generate-assets.mjs`
- `apps/mobile/assets/*.png`
- `apps/mobile/package.json` — `expo-camera`
- `apps/mobile/app.json` — camera plugin, adaptive icon bg
- `apps/mobile/README.md`
- `pnpm-lock.yaml`
