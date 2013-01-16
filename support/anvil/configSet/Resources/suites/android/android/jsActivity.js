
var activity = Ti.Android.currentActivity;
activity.addEventListener("create", function(e) {
	activity.setResult(Ti.Android.RESULT_OK);
	activity.finish();
});