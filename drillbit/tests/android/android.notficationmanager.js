describe("Ti.Android.NotificationManager tests", {
	
	moduleReachable: function() {
		// Just tests if the module is even reachable, by referencing its constants
		valueOf(function() { Ti.Android.NotificationManager.DEFAULT_ALL; }).shouldNotThrowException();
		valueOf(Ti.Android.NotificationManager.DEFAULT_ALL).shouldBeNumber();
		valueOf(Ti.Android.NotificationManager.DEFAULT_LIGHTS).shouldBeNumber();
		valueOf(Ti.Android.NotificationManager.DEFAULT_SOUND).shouldBeNumber();
		valueOf(Ti.Android.NotificationManager.DEFAULT_VIBRATE).shouldBeNumber();
		valueOf(Ti.Android.NotificationManager.FLAG_AUTO_CANCEL).shouldBeNumber();
		valueOf(Ti.Android.NotificationManager.FLAG_INSISTENT).shouldBeNumber();
		valueOf(Ti.Android.NotificationManager.FLAG_NO_CLEAR).shouldBeNumber();
		valueOf(Ti.Android.NotificationManager.FLAG_ONGOING_EVENT).shouldBeNumber();
		valueOf(Ti.Android.NotificationManager.FLAG_ONLY_ALERT_ONCE).shouldBeNumber();
		valueOf(Ti.Android.NotificationManager.FLAG_SHOW_LIGHTS).shouldBeNumber();
		valueOf(Ti.Android.NotificationManager.STREAM_DEFAULT).shouldBeNumber();
	},
	
	notifyTest: function() {
		// Create the intent
		var intent = Ti.Android.createIntent({
			packageName: 'com.appcelerator.mobile',
			className: 'com.appcelerator.ApplicationActivity',
			action: 'android.intent.action'
		});
		
		// Create a pending intent from this
		var pending = Ti.Android.createPendingIntent({
			activity: Ti.Android.currentActivity,
			intent: intent,
			type: Ti.Android.PENDING_INTENT_FOR_ACTIVITY,
			flags: 1073741824
		});
		var notification = Titanium.Android.createNotification({
			contentTitle: 'Alarm',
			contentText: 'Text',
			contentIntent: pending
		});
		valueOf(notification).shouldBeObject();
		valueOf(Ti.Android.NotificationManager.notify(10, notification)).shouldBeUndefined();
		valueOf(Ti.Android.NotificationManager.cancel(100)).shouldBeUndefined();
	},
	
	cancelTest: function() {
		valueOf(function() { Ti.Android.NotificationManager.cancel("bad"); }).shouldThrowException();
		valueOf(Ti.Android.NotificationManager.cancel(0)).shouldBeUndefined();
	},
	
	cancelAllTest: function() {
		valueOf(Ti.Android.NotificationManager.cancelAll()).shouldBeUndefined();
	}
	
});