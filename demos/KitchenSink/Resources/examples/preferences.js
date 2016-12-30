// See:
//	platform/android/res/xml/preferences.xml
//	platform/android/res/values/array.xml
// Similar files MUST be present at build time or
// Titanium.UI.Android.openPreferences() will simply
// do nothing.
//
// To access the value of a preference in your program
// get it from Titanium.App.Properties
//
// example:
//  <EditTextPreference
//    android:title="Edit Text Preference"
//    android:summary="You may enter a string"
//    android:defaultValue=""
//    android:key="editText" />
//
// maps to
//    Titanium.App.Properties.getString("editText");

var btn = Titanium.UI.createButton({
	title:	'Click to Open Preferences'
});
btn.addEventListener('click', function() {
	Titanium.UI.Android.openPreferences();
});
Titanium.UI.currentWindow.add(btn);
