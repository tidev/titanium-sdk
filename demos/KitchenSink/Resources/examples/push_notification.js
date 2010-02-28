var win = Titanium.UI.currentWindow;


var label = Ti.UI.createLabel({
	text:'Attempting to register with Apple for Push Notifications...',
	textAlign:'center',
	width:'auto'
});

win.add(label);

// register for push notifications
Titanium.Network.registerForPushNotifications({
	types: [
		Titanium.Network.NOTIFICATION_TYPE_BADGE,
		Titanium.Network.NOTIFICATION_TYPE_ALERT,
		Titanium.Network.NOTIFICATION_TYPE_SOUND
	],
	success:function(e)
	{
		var deviceToken = e.deviceToken;
		label.text = "Device registered. Device token: \n\n"+deviceToken;
		Ti.API.info("Push notification device token is: "+deviceToken);
		Ti.API.info("Push notification types: "+Titanium.Network.remoteNotificationTypes);
		Ti.API.info("Push notification enabled: "+Titanium.Network.remoteNotificationsEnabled);
	},
	error:function(e)
	{
		label.text = "Error during registration: "+e.error;
	},
	callback:function(e)
	{
		// called when a push notification is received.
		alert("Received a push notification\n\nPayload:\n\n"+JSON.stringify(e.data));
	}
});	
