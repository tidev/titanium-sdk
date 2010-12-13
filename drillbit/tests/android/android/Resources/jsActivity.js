
var activity = Ti.Android.currentActivity;
activity.addEventListener("create", function(e) {
	activity.setResult(Ti.Android.RESULT_OK);

	//TODO effectively the same as activity.finish, but we need to expose it anyway
	Ti.UI.currentWindow.close();
});