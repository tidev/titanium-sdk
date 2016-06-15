#!/usr/bin/env bash

echo '*********** Building ***********'
date

# Get the version from package.json!
VERSION=`sed -n 's/^ *"version": *"//p' package.json | tr -d '"' | tr -d ','`
echo 'VERSION:         ' $VERSION

TIMESTAMP=`date +'%Y%m%d%H%M%S'`
echo 'TIMESTAMP:       ' $TIMESTAMP

VTAG=$VERSION.v$TIMESTAMP
echo 'VTAG:            ' $VTAG

BASENAME=dist/mobilesdk-$VTAG
echo 'BASENAME:        ' $BASENAME
echo 'PATH:            ' $PATH

cd build
npm install .
node scons.js build --android-ndk /Users/build/android-ndk-r10e --android-sdk /Users/build/android-sdk-macosx
node scons.js package android ios --version-tag $VTAG
cd ..

echo
SDK_ARCHIVE="$BASENAME-osx.zip"
echo 'SDK_ARCHIVE: ' $SDK_ARCHIVE

echo Pulling down common test suite
git clone https://github.com/appcelerator/titanium-mobile-mocha-suite.git

echo Copying local tests over top of common suite
cp -R tests/ titanium-mobile-mocha-suite

cd titanium-mobile-mocha-suite/scripts
npm install .
node test.js -b ../../$BASENAME-osx.zip -p android,ios

date
echo '*****************************************'
