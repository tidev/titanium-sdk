#!/bin/bash
# Usage: tests/native/ios/run.sh 'platform=iOS Simulator,id=<device UUID>'
# Requires Xcode and XcodeGen. Builds artifacts outside the repository.
set -euo pipefail
if [[ $# != 1 ]]; then
  echo "Usage: $0 'platform=iOS Simulator,id=<device UUID>'" >&2
  exit 1
fi
export TITANIUM_SDK_ROOT
TITANIUM_SDK_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
export SCENE_TEST_OUTPUT
SCENE_TEST_OUTPUT="$(mktemp -d /tmp/titanium-scene-tests.XXXXXX)"
xcodegen generate --spec "$TITANIUM_SDK_ROOT/tests/native/ios/project.yml" \
  --project-root "$SCENE_TEST_OUTPUT" --project "$SCENE_TEST_OUTPUT"
xcodebuild -quiet -project "$SCENE_TEST_OUTPUT/SceneRegression.xcodeproj" \
  -scheme SceneTests -destination "$1" -derivedDataPath "$SCENE_TEST_OUTPUT/build" \
  -collect-test-diagnostics never test
