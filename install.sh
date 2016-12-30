VERSION=1.7.0
TIMESTAMP=`date +%m%d%Y`
unzip -u ~/Development/Projects/titanium_mobile/dist/mobilesdk-$VERSION-osx.zip -d "/Library/Application Support/Titanium"
sdk="/Library/Application Support/Titanium/mobilesdk/osx"
mv "$sdk/$VERSION" "$sdk/$VERSION-SNAPSHOT"
