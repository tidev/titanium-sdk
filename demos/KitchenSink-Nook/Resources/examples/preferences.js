// See:
//	platform/android/res/xml/preferences.xml
//	platform/android/res/values/array.xml
// Similar files MUST be present at build time or
// Titanium.UI.Android.openPreferences() will simply
// do nothing.

var btn = Titanium.UI.createButton({
	title:	'Click to Open Preferences'
});
btn.addEventListener('click', function() {
	Titanium.UI.Android.openPreferences();
});
Titanium.UI.currentWindow.add(btn);
