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
      GIT_HASH=`git rev-parse --short --no-color HEAD`
fi

# Inject the values into the source
cp TitaniumKit/Sources/API/TopTiModule.m TitaniumKit/Sources/API/TopTiModule.bak
sed -i '' 's@__VERSION__@'"$SDK_VERSION"'@g' TitaniumKit/Sources/API/TopTiModule.m
sed -i '' 's@__TIMESTAMP__@'"$TIMESTAMP"'@g' TitaniumKit/Sources/API/TopTiModule.m
sed -i '' 's@__GITHASH__@'"$GIT_HASH"'@g' TitaniumKit/Sources/API/TopTiModule.m

REVEAL_ARCHIVE_IN_FINDER=false

FRAMEWORK_NAME="TitaniumKit"

SIMULATOR_LIBRARY_PATH="$(pwd)/build/Release-iphonesimulator/${FRAMEWORK_NAME}.framework"

DEVICE_LIBRARY_PATH="$(pwd)/build/Release-iphoneos/${FRAMEWORK_NAME}.framework"

UNIVERSAL_LIBRARY_DIR="$(pwd)/build/Release-iphoneuniversal"

FRAMEWORK="${UNIVERSAL_LIBRARY_DIR}/${FRAMEWORK_NAME}.framework"

######################
# Build Frameworks
######################

XCPRETTY="xcpretty"
which xcpretty || XCPRETTY="cat"

xcodebuild -scheme TitaniumKit -sdk iphonesimulator -configuration Release clean build CONFIGURATION_BUILD_DIR=build/Release-iphonesimulator | eval $XCPRETTY
[[ PIPESTATUS[0] -ne 0 ]] && exit 1

xcodebuild -scheme TitaniumKit -sdk iphoneos -configuration Release clean build CONFIGURATION_BUILD_DIR=build/Release-iphoneos | eval $XCPRETTY
[[ PIPESTATUS[0] -ne 0 ]] && exit 1

# restore TopTiModule.m
rm TitaniumKit/Sources/API/TopTiModule.m
mv TitaniumKit/Sources/API/TopTiModule.bak TitaniumKit/Sources/API/TopTiModule.m

######################
# Create directory for universal
######################

rm -rf "${UNIVERSAL_LIBRARY_DIR}"

mkdir "${UNIVERSAL_LIBRARY_DIR}"

mkdir "${FRAMEWORK}"


######################
# Copy files Framework
######################

cp -r "${DEVICE_LIBRARY_PATH}/." "${FRAMEWORK}"

######################
# Remove arm64 architecture from simulator build - TIMOB-28042
######################

lipo -remove arm64 "${SIMULATOR_LIBRARY_PATH}/${FRAMEWORK_NAME}" -o "${SIMULATOR_LIBRARY_PATH}/${FRAMEWORK_NAME}"

######################
# Make an universal binary
######################

lipo "${SIMULATOR_LIBRARY_PATH}/${FRAMEWORK_NAME}" "${DEVICE_LIBRARY_PATH}/${FRAMEWORK_NAME}" -create -output "${FRAMEWORK}/${FRAMEWORK_NAME}" | echo

# For Swift framework, Swiftmodule needs to be copied in the universal framework
if [ -d "${SIMULATOR_LIBRARY_PATH}/Modules/${FRAMEWORK_NAME}.swiftmodule/" ]; then
cp -f ${SIMULATOR_LIBRARY_PATH}/Modules/${FRAMEWORK_NAME}.swiftmodule/* "${FRAMEWORK}/Modules/${FRAMEWORK_NAME}.swiftmodule/" | echo
fi

if [ -d "${DEVICE_LIBRARY_PATH}/Modules/${FRAMEWORK_NAME}.swiftmodule/" ]; then
cp -f ${DEVICE_LIBRARY_PATH}/Modules/${FRAMEWORK_NAME}.swiftmodule/* "${FRAMEWORK}/Modules/${FRAMEWORK_NAME}.swiftmodule/" | echo
fi

exit 0
