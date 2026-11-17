#!/bin/sh
# Downloads the JSI sources that match the pinned Hermes version.
# The Hermes AAR ships no JSI headers and no libjsi.so, so the spike builds libjsi.so from these files.
set -e
HERMES_TAG="hermes-v250829098.0.19"
BASE="https://raw.githubusercontent.com/facebook/hermes/${HERMES_TAG}/API/jsi/jsi"
DEST="$(dirname "$0")/app/src/main/cpp/third_party/jsi/jsi"
mkdir -p "$DEST"
for f in jsi.h jsi-inl.h jsi.cpp instrumentation.h threadsafe.h decorator.h hermes-interfaces.h jsilib.h; do
	curl -fsSL "${BASE}/${f}" -o "${DEST}/${f}"
done
echo "JSI sources for ${HERMES_TAG} are in ${DEST}"
