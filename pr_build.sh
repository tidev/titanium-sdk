#!/usr/bin/env bash

# !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
#
# DO NOT RUN THIS LOCALLY!
#
# THIS SHELL SCRIPT IS INTENDED FOR JENKINS CI BUILDS AGAINST PULL REQUESTS
# IT MAKES LOTS OF ASSUMPTIONS ABOUT YOUR SYSTEM AND BUILDS ANDROID AND IOS
# SPECIFICALLY FOR RUNNING OUR TEST SUITE AGAINST THEM.
#
# IF YOU'D LIKE TO BUILD TITANIUM LIKE YOU DID WITH SCONS BEFORE, PLEASE
# SEE THE BUILDING SECTION IN README.MD
#
# !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

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
node scons.js build --android-ndk /opt/android-ndk-r11c --android-sdk /opt/android-sdk
node scons.js package android ios --version-tag $VTAG
cd ..

echo
SDK_ARCHIVE="$BASENAME-osx.zip"
echo 'SDK_ARCHIVE: ' $SDK_ARCHIVE

echo Pulling down common test suite
rm -rf titanium-mobile-mocha-suite
git clone https://github.com/appcelerator/titanium-mobile-mocha-suite.git

echo Copying local tests over top of common suite
cp -R tests/ titanium-mobile-mocha-suite

cd titanium-mobile-mocha-suite/scripts
npm install .
node test.js -b ../../$BASENAME-osx.zip -p android,ios

date
echo '*****************************************'
