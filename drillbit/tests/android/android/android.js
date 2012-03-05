describe("Ti.Android tests", {
	androidAPIs: function() {
		valueOf(Ti.Android).shouldNotBeNull();
		valueOf(Ti.Android.currentActivity).shouldNotBeNull();
	},

	//https://appcelerator.lighthouseapp.com/projects/32238/tickets/1592-android-move-menu-to-tiandroidactivity
	androidMenu: function() {
		var activity = Ti.Android.currentActivity;
		
		valueOf(activity.onCreateOptionsMenu).shouldBeUndefined();
		activity.onCreateOptionsMenu = function(e) {};
		valueOf(activity.onCreateOptionsMenu).shouldBeFunction();
		
		valueOf(activity.onPrepareOptionsMenu).shouldBeUndefined();
		activity.onPrepareOptionsMenu = function(e) {};
		valueOf(activity.onPrepareOptionsMenu).shouldBeFunction();
	},

	//https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2492-android-custom-js-activities-dont-correctly-pre-parse-the-url-attribute
	jsActivityUrl: asyncTest(function() {
		var intent = Ti.Android.createIntent({
			action: Ti.Android.ACTION_MAIN,
			url: 'jsActivity.js'
		});
		intent.addCategory(Ti.Android.CATEGORY_LAUNCHER);
		Ti.Android.currentActivity.startActivityForResult(intent, this.async(function(e) {
			Ti.API.debug(JSON.stringify(e));
			valueOf(e.resultCode).shouldBe(Ti.Android.RESULT_OK);
		}));
	}),

	// https://appcelerator.lighthouseapp.com/projects/32238/tickets/2564-android-expose-pendingintent-flag_-constants-in-android-module
	pendingIntentFlags: function() {
		valueOf(Ti.Android.FLAG_CANCEL_CURRENT).shouldBeNumber();
		valueOf(Ti.Android.FLAG_NO_CREATE).shouldBeNumber();
		valueOf(Ti.Android.FLAG_ONE_SHOT).shouldBeNumber();
		valueOf(Ti.Android.FLAG_UPDATE_CURRENT).shouldBeNumber();
	},
	// https://appcelerator.lighthouseapp.com/projects/32238/tickets/3248-android-support-intent-flags
	intentFlags : function() {
		valueOf(Ti.Android.FLAG_GRANT_READ_URI_PERMISSION).shouldBeNumber();
		valueOf(Ti.Android.FLAG_GRANT_WRITE_URI_PERMISSION).shouldBeNumber();
		valueOf(Ti.Android.FLAG_DEBUG_LOG_RESOLUTION).shouldBeNumber();
		valueOf(Ti.Android.FLAG_FROM_BACKGROUND).shouldBeNumber();
		valueOf(Ti.Android.FLAG_ACTIVITY_BROUGHT_TO_FRONT).shouldBeNumber();
		//API 11 valueOf(Ti.Android.FLAG_ACTIVITY_CLEAR_TASK).shouldBeNumber();
		valueOf(Ti.Android.FLAG_ACTIVITY_CLEAR_TOP).shouldBeNumber();
		valueOf(Ti.Android.FLAG_ACTIVITY_CLEAR_WHEN_TASK_RESET).shouldBeNumber();
		valueOf(Ti.Android.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS).shouldBeNumber();
		valueOf(Ti.Android.FLAG_ACTIVITY_FORWARD_RESULT).shouldBeNumber();
		valueOf(Ti.Android.FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY).shouldBeNumber();
		valueOf(Ti.Android.FLAG_ACTIVITY_MULTIPLE_TASK).shouldBeNumber();
		valueOf(Ti.Android.FLAG_ACTIVITY_NEW_TASK).shouldBeNumber();
		valueOf(Ti.Android.FLAG_ACTIVITY_NO_ANIMATION).shouldBeNumber();
		valueOf(Ti.Android.FLAG_ACTIVITY_NO_HISTORY).shouldBeNumber();
		valueOf(Ti.Android.FLAG_ACTIVITY_NO_USER_ACTION).shouldBeNumber();
		valueOf(Ti.Android.FLAG_ACTIVITY_PREVIOUS_IS_TOP).shouldBeNumber();
		valueOf(Ti.Android.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED).shouldBeNumber();
		valueOf(Ti.Android.FLAG_ACTIVITY_REORDER_TO_FRONT).shouldBeNumber();
		valueOf(Ti.Android.FLAG_ACTIVITY_SINGLE_TOP).shouldBeNumber();
		//API 11 sconsvalueOf(Ti.Android.FLAG_ACTIVITY_TASK_ON_HOME).shouldBeNumber();
		valueOf(Ti.Android.FLAG_RECEIVER_REGISTERED_ONLY).shouldBeNumber();		
	},
	intentFlagAccessors : function() {
		var intent = Ti.Android.createIntent({
			action : Ti.Android.ACTION_MAIN,
			flags : Ti.Android.FLAG_ACTIVITY_NEW_TASK
		});
		// Test presence of methods
		valueOf(intent.getFlags).shouldBeFunction();
		valueOf(intent.setFlags).shouldBeFunction();
		valueOf(intent.addFlags).shouldBeFunction();
		
		// Check flags from create args
		valueOf(intent.flags).shouldBeNumber();
		valueOf(intent.getFlags()).shouldBe(Ti.Android.FLAG_ACTIVITY_NEW_TASK);
		
		intent.flags = Ti.Android.FLAG_ACTIVITY_NO_HISTORY;
		valueOf(intent.flags).shouldBe(Ti.Android.FLAG_ACTIVITY_NO_HISTORY);
		
		intent.addFlags(Ti.Android.FLAG_ACTIVITY_NEW_TASK);
		valueOf(intent.getFlags()).shouldBe(Ti.Android.FLAG_ACTIVITY_NEW_TASK + Ti.Android.FLAG_ACTIVITY_NO_HISTORY);
		
		intent = Ti.Android.createIntent({
			action : Ti.Android.ACTION_MAIN
		});
		
		valueOf(intent.flags).shouldBeNumber();
		valueOf(intent.flags).shouldBe(0);
		intent.setFlags(Ti.Android.FLAG_ACTIVITY_NEW_TASK);
		valueOf(intent.getFlags()).shouldBe(Ti.Android.FLAG_ACTIVITY_NEW_TASK);
	},

	// http://jira.appcelerator.org/browse/TIMOB-6928
	proxyInvocation: function() {
		var intent, pending, notification;
		valueOf(function() {
			intent = Ti.Android.createIntent({
				className:"org.appcelerator.titanium.TiActivity",
				flags: Ti.Android.FLAG_ACTIVITY_CLEAR_TOP | Ti.Android.FLAG_ACTIVITY_SINGLE_TOP,
				packageName:Ti.App.id
			});
		}).shouldNotThrowException();

		valueOf(function() {
			pending = Ti.Android.createPendingIntent({
				intent: intent,
				flags:Ti.Android.FLAG_UPDATE_CURRENT
			});
		}).shouldNotThrowException();

		valueOf(function() {
			var notification = Ti.Android.createNotification({
				contentTitle: "hello",
				contentText: "hello",
				when: 0,
				contentIntent: pending,
				icon: Ti.Android.R.drawable.progress_indeterminate_horizontal,
				tickerText: "hello",
				flags: (Ti.Android.FLAG_ONGOING_EVENT | Ti.Android.FLAG_NO_CLEAR)
			});
		}).shouldNotThrowException();
	},
	
	options: {
		forceBuild: true
	}
});
