# Based on https://medium.com/@syshen/create-an-ios-universal-framework-148eb130a46c, thank you!

export DEVELOPER_DIR=$(xcode-select -p | sed 's/\.0\.0/\.0/g')

XCODE_VERSION=$(/usr/libexec/PlistBuddy -c "Print :DTXcode" "$DEVELOPER_DIR/../Info.plist")

FRAMEWORK_NAME="${PROJECT_NAME}" \
SCHEME="${PROJECT_NAME}" \
UNIVERSAL_OUTPUTFOLDER=${BUILD_DIR}

#----- Make macCatalyst archive
xcodebuild archive \
-scheme $SCHEME \
-archivePath $UNIVERSAL_OUTPUTFOLDER/macCatalyst.xcarchive \
-sdk macosx \
SKIP_INSTALL=NO \
BUILD_LIBRARIES_FOR_DISTRIBUTION=YES \
SUPPORTS_MACCATALYST=YES \

#----- Make iOS Simulator archive
xcodebuild archive \
-scheme $SCHEME \
-archivePath $UNIVERSAL_OUTPUTFOLDER/simulator.xcarchive \
-sdk iphonesimulator \
SKIP_INSTALL=NO BUILD_LIBRARIES_FOR_DISTRIBUTION=YES

#----- Make iOS device archive
xcodebuild archive \
-scheme $SCHEME \
-archivePath $UNIVERSAL_OUTPUTFOLDER/iosdevice.xcarchive \
-sdk iphoneos \
SKIP_INSTALL=NO BUILD_LIBRARIES_FOR_DISTRIBUTION=YES

#----- Make XCFramework
xcodebuild -create-xcframework \
-framework $UNIVERSAL_OUTPUTFOLDER/simulator.xcarchive/Products/Library/Frameworks/$SCHEME.framework \
-framework $UNIVERSAL_OUTPUTFOLDER/iosdevice.xcarchive/Products/Library/Frameworks/$SCHEME.framework \
-framework $UNIVERSAL_OUTPUTFOLDER/macCatalyst.xcarchive/Products/Library/Frameworks/$SCHEME.framework \
-output ${PROJECT_DIR}/dist/$SCHEME.xcframework
