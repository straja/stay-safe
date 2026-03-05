#!/usr/bin/env bash
set -e

EMULATOR="$HOME/Library/Android/sdk/emulator/emulator"
ADB="$HOME/Library/Android/sdk/platform-tools/adb"

# Pick first available AVD
AVD=$("$EMULATOR" -list-avds 2>/dev/null | head -1)
if [[ -z "$AVD" ]]; then
  echo "No Android Virtual Device found. Create one in Android Studio first."
  exit 1
fi

# Check if an emulator is already running
RUNNING=$("$ADB" devices 2>/dev/null | grep -c "emulator" || true)
if [[ "$RUNNING" -gt 0 ]]; then
  echo "Emulator already running, skipping boot."
  exit 0
fi

echo "Starting emulator: $AVD"
"$EMULATOR" "@$AVD" -no-audio -no-boot-anim &

echo "Waiting for device to come online..."
"$ADB" wait-for-device

echo "Waiting for boot to complete..."
until "$ADB" shell getprop sys.boot_completed 2>/dev/null | grep -q "1"; do
  sleep 2
done

echo "Emulator ready."
