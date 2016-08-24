#!/usr/bin/env bash

# !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
#
# DO NOT RUN THIS LOCALLY!
#
# THIS SHELL SCRIPT IS INTENDED FOR JENKINS CI BUILDS.
# IT MAKES LOTS OF ASSUMPTIONS ABOUT YOUR SYSTEM AND BUILDS ALL PLATFORMS
# FOR ALL OSES. IT ALSO ATTEMPTS TO UPLOAD THE BUILT ZIPS UP TO S3
#
# IF YOU'D LIKE TO BUILD TITANIUM LIKE YOU DID WITH SCONS BEFORE, PLEASE
# SEE THE BUILDING SECTION IN README.MD
#
# !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

if [ "$1" != "" ]; then
    BRANCH=$1
else
    BRANCH="master"
fi


echo '*********** Remove and re-download Windows ***********'
rm -rf windows
curl http://studio-jenkins.appcelerator.org/job/titanium_mobile_windows_${BRANCH//_/.}/lastSuccessfulBuild/artifact/dist/windows/*zip*/windows.zip > windows.zip
unzip -q windows.zip
rm windows.zip
echo '*****************************************'

echo '*********** Building ***********'
date
export JAVA_HOME=/usr/lib/jvm/java-6-sun
#npm test

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

export ANDROID_NDK=$JENKINS_HOME/android-ndk-r11c

echo 'NODE_APPC_BRANCH: latest stable from npm'

cd build
npm install .
node scons.js build
node scons.js package --version-tag $VTAG --all
cd ..


if [ "$PYTHON" = "" ]; then
        PYTHON=python
fi

echo
echo 'BUILD_URL: ' $BUILD_URL

echo
SDK_ARCHIVE="$BASENAME-osx.zip"
echo 'SDK_ARCHIVE: ' $SDK_ARCHIVE

echo
echo Latest changes:
echo $CHANGES_SINCE_LAST_SUCCESS
echo

# $PYTHON $TITANIUM_BUILD/common/s3_cleaner.py mobile $BRANCH
$PYTHON $TITANIUM_BUILD/common/s3_uploader.py mobile $BASENAME-osx.zip $BRANCH $GIT_COMMIT $BUILD_URL
$PYTHON $TITANIUM_BUILD/common/s3_uploader.py mobile $BASENAME-linux.zip $BRANCH $GIT_COMMIT $BUILD_URL
$PYTHON $TITANIUM_BUILD/common/s3_uploader.py mobile $BASENAME-win32.zip $BRANCH $GIT_COMMIT $BUILD_URL

if [ -e "dist/parity.html" ]; then
    mv dist/parity.html $BASENAME-parity.html
    $PYTHON $TITANIUM_BUILD/common/s3_uploader.py mobile $BASENAME-parity.html $BRANCH $GIT_COMMIT $BUILD_URL
fi

date
echo '*****************************************'
