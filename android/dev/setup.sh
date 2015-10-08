echo "Downloading Eclipse 4.5.1..."
curl -O http://ftp.osuosl.org/pub/eclipse/eclipse/downloads/drops4/R-4.5.1-201509040015/eclipse-SDK-4.5.1-macosx-cocoa-x86_64.tar.gz

echo "Extracting Eclipse"
tar -zxf eclipse-SDK-4.5.1-macosx-cocoa-x86_64.tar.gz

echo "Installing ADT into Eclipse"
java_home=`/usr/libexec/java_home`
echo $java_home
./Eclipse.app/Contents/MacOS/eclipse -application org.eclipse.equinox.p2.director -repository https://dl-ssl.google.com/android/eclipse/ -installIU com.android.ide.eclipse.adt.feature.feature.group -vm $java_home/jre/lib/server/libjvm.dylib -nosplash

echo "Installing Eclipse into Applications folder"
mv Eclipse.app /Applications/Eclipse.app

# TODO Look for Android SDK/NDK, check ANDROID_SDK and ANDROID_NDK anv vars. Maybe install SDK/NDK for them if they don't have it set up?
# TODO Generate a workspace that has all the projects already imported for the user?