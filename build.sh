
echo '*********** Remove and re-download Windows ***********'
rm -rf windows
curl http://studio-jenkins.appcelerator.org/job/titanium_mobile_windows_master/lastSuccessfulBuild/artifact/dist/windows/*zip*/windows.zip > windows.zip
unzip -q windows.zip
rm windows.zip
echo '*****************************************'

echo '*********** Building ***********'
date
export JAVA_HOME=/usr/lib/jvm/java-6-sun
#npm test

VERSION=`python $TITANIUM_BUILD/common/get_version.py | tr -d '
'`
echo 'VERSION:         ' $VERSION

TIMESTAMP=`date +'%Y%m%d%H%M%S'`
echo 'TIMESTAMP:       ' $TIMESTAMP

VTAG=$VERSION.v$TIMESTAMP
echo 'VTAG:            ' $VTAG

BASENAME=dist/mobilesdk-$VTAG
echo 'BASENAME:        ' $BASENAME
echo 'PATH:            ' $PATH

echo 'NODE_APPC_BRANCH: latest stable from npm'
scons package_all=1 version_tag=$VTAG $TI_MOBILE_SCONS_ARGS

if [ "$PYTHON" = "" ]; then
        PYTHON=python
fi

echo
echo 'TI_MOBILE_SCONS_ARGS: ' $TI_MOBILE_SCONS_ARGS
echo
echo 'BUILD_URL: ' $BUILD_URL

echo
SDK_ARCHIVE="$BASENAME-osx.zip"
echo 'SDK_ARCHIVE: ' $SDK_ARCHIVE

echo
echo Latest changes:
echo $CHANGES_SINCE_LAST_SUCCESS
echo

# $PYTHON $TITANIUM_BUILD/common/s3_cleaner.py mobile master
$PYTHON $TITANIUM_BUILD/common/s3_uploader.py mobile $BASENAME-osx.zip master $GIT_COMMIT $BUILD_URL
$PYTHON $TITANIUM_BUILD/common/s3_uploader.py mobile $BASENAME-linux.zip master $GIT_COMMIT $BUILD_URL
$PYTHON $TITANIUM_BUILD/common/s3_uploader.py mobile $BASENAME-win32.zip master $GIT_COMMIT $BUILD_URL

if [ -e "dist/parity.html" ]; then
    mv dist/parity.html $BASENAME-parity.html
    $PYTHON $TITANIUM_BUILD/common/s3_uploader.py mobile $BASENAME-parity.html master $GIT_COMMIT $BUILD_URL
fi

date
echo '*****************************************'
