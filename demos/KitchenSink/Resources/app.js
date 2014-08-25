var win = Ti.UI.createWindow({
    backgroundColor : "#FFF"
});

var button1 = Ti.UI.createButton({
    title: 'register notifications',
    top: 10
});

button1.addEventListener('click', function(e) {
    	// register a background service. this JS will run when the app is backgrounded

	var acceptAction = Ti.App.iOS.createUserNotificationAction({
		identifier: "ACCEPT_IDENTIFIER",
		title: "Accept",
		activationMode: Ti.App.iOS.NOTIFICATION_ACTIVATION_MODE_BACKGROUND,
		destructive: false,
		authenticationRequired: false
	}) ;
	//    Ti.API.info("acceptAction: "+JSON.stringify(acceptAction));
	var maybeAction = Ti.App.iOS.createUserNotificationAction({
		identifier: "MAYBE_IDENTIFIER",
		title: "Maybe",
		activationMode: Ti.App.iOS.NOTIFICATION_ACTIVATION_MODE_BACKGROUND,
		destructive: false,
		authenticationRequired: false
	}) ;
	
	var declineAction = Ti.App.iOS.createUserNotificationAction({
		identifier: "DECLINE_IDENTIFIER",
		title: "Decline",
		activationMode: Ti.App.iOS.NOTIFICATION_ACTIVATION_MODE_BACKGROUND,
		destructive: false,
		authenticationRequired: false
	}) ;

	var backgroundCategory = Ti.App.iOS.createUserNotificationCategory({
		identifier: "BACKGROUND_CATEGORY",
		actionsForDefaultContext: [acceptAction, maybeAction, declineAction],
		actionsForMinimalContext: [acceptAction, declineAction]
	});

	var trashAction = Ti.App.iOS.createUserNotificationAction({
		identifier: "TRASH_IDENTIFIER",
		title: "Trash",
		activationMode: Ti.App.iOS.NOTIFICATION_ACTIVATION_MODE_BACKGROUND,
		destructive: true,
		authenticationRequired: true
	}) ;

	var backgroundLockCategory = Ti.App.iOS.createUserNotificationCategory({
		identifier: "BACKGROUND_LOCK_CATEGORY",
		actionsForDefaultContext: [trashAction]
	});

	var replyAction = Ti.App.iOS.createUserNotificationAction({
		identifier: "REPLY_IDENTIFIER",
		title: "Reply",
		activationMode: Ti.App.iOS.NOTIFICATION_ACTIVATION_MODE_FOREGROUND,
		destructive: false,
		authenticationRequired: true
	}) ;

	var foregroundCategory = Ti.App.iOS.createUserNotificationCategory({
		identifier: "FOREGROUND_CATEGORY",
		actionsForDefaultContext: [replyAction]
	});

   //   Ti.API.info("category: "+JSON.stringify(backgroundCategory));
    alert("Register Pressed");
    //Ti.App.iOS.registerUserNotificationSettings({
    Ti.App.iOS.registerForLocalNotifications({
    types: Ti.App.iOS.NOTIFICATION_TYPE_SOUND|Ti.App.iOS.NOTIFICATION_TYPE_ALERT,
    categories: [backgroundCategory,backgroundLockCategory,foregroundCategory]
	});
});

var button2 = Ti.UI.createButton({
    title: 'fire background notifications',
    top: 60
    
});

button2.addEventListener('click', function(e) {
   //fire background
	var service = Ti.App.iOS.registerBackgroundService({url:'bgNotification.js'});
    alert("Background Pressed");

});

var button3 = Ti.UI.createButton({
    title: 'clear notifications',
    top: 110
    
});

button3.addEventListener('click', function(e) {
    alert("Clear Pressed");
    Ti.App.iOS.cancelAllLocalNotifications();

});

var button4 = Ti.UI.createButton({
    title: 'fire background (lock) notifications',
    top: 160
    
});

button4.addEventListener('click', function(e) {
   //fire background
	var service = Ti.App.iOS.registerBackgroundService({url:'bgNotificationLock.js'});
    alert("Background (lock) Pressed");

});

var button5 = Ti.UI.createButton({
    title: 'fire foreground notifications',
    top: 210
    
});

button5.addEventListener('click', function(e) {
   //fire background
	var service = Ti.App.iOS.registerBackgroundService({url:'fgNotification.js'});
    alert("foreground Pressed");

});

var labelLog = Ti.UI.createLabel({
	text: 'no log',
	top: 260
})
win.add(button1);
win.add(button2);
win.add(button3);
win.add(button4);
win.add(button5);
win.add(labelLog);

Ti.App.iOS.addEventListener('notification',function(e)
{
    Ti.API.info("local notification received: "+JSON.stringify(e));
   labelLog.text = "Foreground task done";
    // alert("schedule received");
});

Ti.App.iOS.addEventListener('backgroundNotification',function(e)
{
    Ti.API.info("local notification received: "+JSON.stringify(e));
   labelLog.text = "Background task done";
  //   alert("schedule received");
});


win.open();
