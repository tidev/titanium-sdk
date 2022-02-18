#!/bin/bash

SCRIPT_PATH=$(cd "$(dirname "$0")"; pwd)
cd $SCRIPT_PATH

# Change to TitaniumKit directory
cd ../../iphone/TitaniumKit

# Use the SDK version, timestamp and git hash passed in to use via options, and fall back to calculating them ourselves if not specified
SDK_VERSION=""
TIMESTAMP=""
GIT_HASH=""

while getopts v:t:h: option
do
case "${option}"
in
v) SDK_VERSION=${OPTARG};;
t) TIMESTAMP=${OPTARG};;
h) GIT_HASH=$OPTARG;;
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

UNIVERSAL_LIBRARY_DIR="$(pwd)/build"

FRAMEWORK="${UNIVERSAL_LIBRARY_DIR}/${FRAMEWORK_NAME}.xcframework"

mkdir "${UNIVERSAL_LIBRARY_DIR}"

#----- Make macCatalyst archive
xcodebuild archive \
-scheme $FRAMEWORK_NAME \
-archivePath $MAC_ARCHIVE_PATH \
-sdk macosx \
SKIP_INSTALL=NO \
BUILD_LIBRARIES_FOR_DISTRIBUTION=YES \
SUPPORTS_MACCATALYST=YES \

#----- Make iOS Simulator archive
xcodebuild archive \
-scheme $FRAMEWORK_NAME \
-archivePath $SIMULATOR_ARCHIVE_PATH \
-sdk iphonesimulator \
SKIP_INSTALL=NO BUILD_LIBRARIES_FOR_DISTRIBUTION=YES

#----- Make iOS device archive
xcodebuild archive \
-scheme $FRAMEWORK_NAME \
-archivePath $DEVICE_ARCHIVE_PATH \
-sdk iphoneos \
SKIP_INSTALL=NO BUILD_LIBRARIES_FOR_DISTRIBUTION=YES

# restore TopTiModule.m
rm TitaniumKit/Sources/API/TopTiModule.m
mv TitaniumKit/Sources/API/TopTiModule.bak TitaniumKit/Sources/API/TopTiModule.m

#----- Make XCFramework
xcodebuild -create-xcframework \
-framework $SIMULATOR_ARCHIVE_PATH/Products/Library/Frameworks/$FRAMEWORK_NAME.framework \
-framework $DEVICE_ARCHIVE_PATH/Products/Library/Frameworks/$FRAMEWORK_NAME.framework \
-framework $MAC_ARCHIVE_PATH/Products/Library/Frameworks/$FRAMEWORK_NAME.framework \
-output $FRAMEWORK
