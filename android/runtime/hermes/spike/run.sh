#!/bin/sh
# Installs the spike on one device and prints its report.
# Usage: ./run.sh <adb serial> [debug|release]
set -e
SERIAL="$1"
VARIANT="${2:-debug}"
APK="$(dirname "$0")/app/build/outputs/apk/${VARIANT}/app-${VARIANT}.apk"
adb -s "$SERIAL" install -r "$APK" | tail -1
adb -s "$SERIAL" logcat -c
adb -s "$SERIAL" shell am start -W -n ti.hermes.spike/.MainActivity | grep -E 'Status|TotalTime|Error'
i=0
while [ $i -lt 30 ]; do
	if adb -s "$SERIAL" logcat -d -s HermesSpike:I | grep -q 'SPIKE DONE'; then
		break
	fi
	i=$((i + 1))
	adb -s "$SERIAL" shell sleep 1
done
adb -s "$SERIAL" logcat -d -s HermesSpike:I | sed -E 's/^.* I HermesSpike: //'
adb -s "$SERIAL" logcat -d -s DEBUG:F | grep -m3 -E 'Abort message|Caused by|signal' || true
