#!/bin/bash
# Run this after Xcode finishes installing from the App Store.
set -e

echo "==> Switching developer tools to Xcode.app..."
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer

echo "==> Accepting Xcode license..."
sudo xcodebuild -license accept

echo "==> Installing additional Xcode components..."
xcodebuild -runFirstLaunch 2>/dev/null || true

echo "==> Booting iPhone 16 simulator..."
# Find an available iPhone simulator
DEVICE_ID=$(xcrun simctl list devices available | grep "iPhone 16" | grep -v "Plus\|Pro\|Max" | head -1 | sed 's/.*(\(.*\)).*/\1/')

if [ -z "$DEVICE_ID" ]; then
  echo "  iPhone 16 not found, looking for any iPhone..."
  DEVICE_ID=$(xcrun simctl list devices available | grep "iPhone" | head -1 | sed 's/.*(\(.*\)).*/\1/')
fi

if [ -z "$DEVICE_ID" ]; then
  echo "  No simulator found. Open Xcode > Window > Devices and Simulators to create one."
  exit 1
fi

echo "==> Booting device $DEVICE_ID..."
xcrun simctl boot "$DEVICE_ID" 2>/dev/null || true
open -a Simulator

echo ""
echo "All done! Now run the app:"
echo "  cd \"/Users/macbookpro/Desktop/Private work/stay-safe\""
echo "  npx expo start --ios"
