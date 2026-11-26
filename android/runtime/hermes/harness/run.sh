#!/bin/sh
# Installs the harness on one device and prints its report.
# Usage: ./run.sh <adb serial> [debug|release]
set -e
SERIAL="$1"
VARIANT="${2:-debug}"
APK="$(dirname "$0")/app/build/outputs/apk/${VARIANT}/app-${VARIANT}.apk"
adb -s "$SERIAL" install -r "$APK" | tail -1
adb -s "$SERIAL" logcat -c
adb -s "$SERIAL" shell am start -W -n ti.hermes.harness/ti.harness.MainActivity | grep -E 'Status|Error'
i=0
while [ $i -lt 60 ]; do
	if adb -s "$SERIAL" logcat -d -s HermesHarness:I | grep -q 'HARNESS DONE'; then
		break
	fi
	if adb -s "$SERIAL" logcat -d -s DEBUG:F | grep -q 'signal'; then
		break
	fi
	i=$((i + 1))
	adb -s "$SERIAL" shell sleep 1
done
adb -s "$SERIAL" logcat -d -s HermesHarness:V | sed -E "s/^.* [IE] HermesHarness: //"
adb -s "$SERIAL" logcat -d -s DEBUG:F | grep -m12 -E 'Abort message|Caused by|signal|#0[0-9] ' || true
