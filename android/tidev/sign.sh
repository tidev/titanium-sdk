jarsigner -storepass fredfred -keystore keystore -signedjar tidev.apk bin/tidev-unsigned.apk android 
#adb -d install -r tidev.apk
adb -e install -r tidev.apk
