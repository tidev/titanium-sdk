#!/bin/bash
set -euo pipefail

SCRIPT_PATH=$(cd "$(dirname "$0")"; pwd)
cd $SCRIPT_PATH

# Change to TitaniumKit directory
cd ../../iphone/TitaniumKit

# Use the SDK version, timestamp and git hash passed in to use via options, and fall back to calculating them ourselves if not specified
SDK_VERSION=""
TIMESTAMP=""
GIT_HASH=""
ADD_DEBUG_SYMBOLS=false
SIMULATOR_DEBUG_SYMBOLS=""
DEVICE_DEBUG_SYMBOLS=""
MAC_DEBUG_SYMBOLS=""

while getopts v:t:h:d option
do
case "${option}"
in
v) SDK_VERSION=${OPTARG};;
t) TIMESTAMP=${OPTARG};;
h) GIT_HASH=${OPTARG};;
d) ADD_DEBUG_SYMBOLS=true;;
esac
done

if [ -z "$SDK_VERSION" ]
then
      SDK_VERSION=`node -p "require('../../package.json').version;"`
fi

if [ -z "$TIMESTAMP" ]
then
      TIMESTAMP=`date +"%m/%d/%Y %H:%M"`
fi

if [ -z "$GIT_HASH" ]
then
      GIT_HASH=`git rev-parse --short=10 --no-color HEAD`
fi

export TI_VERSION="$SDK_VERSION"

# Inject the values into the source
cp TitaniumKit/Sources/API/TopTiModule.m TitaniumKit/Sources/API/TopTiModule.bak
sed -i '' 's@__VERSION__@'"$SDK_VERSION"'@g' TitaniumKit/Sources/API/TopTiModule.m
sed -i '' 's@__TIMESTAMP__@'"$TIMESTAMP"'@g' TitaniumKit/Sources/API/TopTiModule.m
sed -i '' 's@__GITHASH__@'"$GIT_HASH"'@g' TitaniumKit/Sources/API/TopTiModule.m

REVEAL_ARCHIVE_IN_FINDER=false

XCODE_VERSION=$(/usr/libexec/PlistBuddy -c "Print :DTXcode" "$(xcode-select -p)/../Info.plist")

FRAMEWORK_NAME="TitaniumKit"

MAC_ARCHIVE_PATH="$(pwd)/build/macCatalyst.xcarchive"
DEVICE_ARCHIVE_PATH="$(pwd)/build/iosdevice.xcarchive"
SIMULATOR_ARCHIVE_PATH="$(pwd)/build/simulator.xcarchive"

# Debug symbols for symbolicated crash reports
if [ "$ADD_DEBUG_SYMBOLS" = true ]
then
      SIMULATOR_DEBUG_SYMBOLS="-debug-symbols $SIMULATOR_ARCHIVE_PATH/dSYMs/$FRAMEWORK_NAME.framework.dSYM"
      DEVICE_DEBUG_SYMBOLS="-debug-symbols $DEVICE_ARCHIVE_PATH/dSYMs/$FRAMEWORK_NAME.framework.dSYM"
      MAC_DEBUG_SYMBOLS="-debug-symbols $MAC_ARCHIVE_PATH/dSYMs/$FRAMEWORK_NAME.framework.dSYM"
fi

UNIVERSAL_LIBRARY_DIR="$(pwd)/build"

FRAMEWORK_PATH="${UNIVERSAL_LIBRARY_DIR}/${FRAMEWORK_NAME}.xcframework"

mkdir -p "${UNIVERSAL_LIBRARY_DIR}"

# Clean previous archives/output if they exist
rm -rf "$MAC_ARCHIVE_PATH" "$DEVICE_ARCHIVE_PATH" "$SIMULATOR_ARCHIVE_PATH" "$FRAMEWORK_PATH"

#----- Make macCatalyst archive
xcodebuild archive \
-scheme $FRAMEWORK_NAME \
-archivePath $MAC_ARCHIVE_PATH \
-sdk macosx \
-destination generic/platform=macOS \
SKIP_INSTALL=NO \
BUILD_LIBRARIES_FOR_DISTRIBUTION=YES \
SUPPORTS_MACCATALYST=YES \

#----- Make iOS Simulator archive
xcodebuild archive \
-scheme $FRAMEWORK_NAME \
-archivePath $SIMULATOR_ARCHIVE_PATH \
-sdk iphonesimulator \
-destination "generic/platform=iOS Simulator" \
SKIP_INSTALL=NO \
BUILD_LIBRARIES_FOR_DISTRIBUTION=YES \
SUPPORTS_MACCATALYST=NO

#----- Make iOS device archive
xcodebuild archive \
-scheme $FRAMEWORK_NAME \
-archivePath $DEVICE_ARCHIVE_PATH \
-sdk iphoneos \
-destination generic/platform=iOS \
SKIP_INSTALL=NO \
BUILD_LIBRARIES_FOR_DISTRIBUTION=YES \
SUPPORTS_MACCATALYST=NO

# Restore TopTiModule.m
rm TitaniumKit/Sources/API/TopTiModule.m
mv TitaniumKit/Sources/API/TopTiModule.bak TitaniumKit/Sources/API/TopTiModule.m

#----- Make XCFramework
# Ensure we remove any pre-existing output to avoid duplicate variant errors
rm -rf "$FRAMEWORK_PATH"
xcodebuild -create-xcframework \
-framework $SIMULATOR_ARCHIVE_PATH/Products/Library/Frameworks/$FRAMEWORK_NAME.framework $SIMULATOR_DEBUG_SYMBOLS \
-framework $DEVICE_ARCHIVE_PATH/Products/Library/Frameworks/$FRAMEWORK_NAME.framework $DEVICE_DEBUG_SYMBOLS \
-framework $MAC_ARCHIVE_PATH/Products/Library/Frameworks/$FRAMEWORK_NAME.framework $MAC_DEBUG_SYMBOLS \
-output $FRAMEWORK_PATH

#----- Fix Mac Catalyst slice symlinks
# xcodebuild -create-xcframework doesn't preserve symlinks properly for versioned frameworks
# We need to manually restore the symlinks in the Mac Catalyst slice
MAC_CATALYST_SLICE="$FRAMEWORK_PATH/ios-arm64_x86_64-maccatalyst/$FRAMEWORK_NAME.framework"
if [ -d "$MAC_CATALYST_SLICE/Versions/A" ]; then
	(
		cd "$MAC_CATALYST_SLICE"
		ln -sfn A Versions/Current
		ln -sfn Versions/Current/Headers Headers
		ln -sfn Versions/Current/Modules Modules
		ln -sfn Versions/Current/Resources Resources
		ln -sfn Versions/Current/$FRAMEWORK_NAME $FRAMEWORK_NAME
	)
fi
