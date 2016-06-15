#!/usr/bin/env bash

echo '*********** Remove and re-download Windows ***********'
rm -rf windows
curl http://studio-jenkins.appcelerator.org/job/titanium_mobile_windows_master/lastSuccessfulBuild/artifact/dist/windows/*zip*/windows.zip > windows.zip
unzip -q windows.zip
rm windows.zip
echo '*****************************************'

echo '*********** Building ***********'
date
#export JAVA_HOME=/usr/lib/jvm/java-6-sun
#npm test

# TODO Get the version from package.json!
VERSION=`sed -n 's/^version *= *//p' build/titanium_version.py | tr -d "'" | tr -d '"'`
echo 'VERSION:         ' $VERSION

TIMESTAMP=`date +'%Y%m%d%H%M%S'`
echo 'TIMESTAMP:       ' $TIMESTAMP

VTAG=$VERSION.v$TIMESTAMP
echo 'VTAG:            ' $VTAG

BASENAME=dist/mobilesdk-$VTAG
echo 'BASENAME:        ' $BASENAME
echo 'PATH:            ' $PATH

PATH=/usr/local/bin:$PATH

ANDROID_SDK=/Users/build/android-sdk-macosx
ANDROID_NDK=/Users/build/android-ndk-r10e

echo 'NODE_APPC_BRANCH: latest stable from npm'
scons package_all=1 version_tag=$VTAG build_jsca=0

if [ "$PYTHON" = "" ]; then
    PYTHON=python
fi

echo
echo 'TI_MOBILE_SCONS_ARGS: ' $TI_MOBILE_SCONS_ARGS

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
