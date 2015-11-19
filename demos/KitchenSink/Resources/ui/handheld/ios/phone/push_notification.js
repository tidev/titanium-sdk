function push_notifications(_args) {
	var win = Titanium.UI.createWindow({
		title:_args.title
	});
	
	var label = Ti.UI.createLabel({
		text:'Attempting to register with Apple for Push Notifications...',
		textAlign:'center',
		width:Ti.UI.SIZE
	});
	
	win.add(label);
	
	function success(e) {
		var deviceToken = e.deviceToken;
		label.text = "Device registered. Device token: \n\n"+deviceToken;
		
		Ti.API.info("Push notification device token is: "+deviceToken);
		Ti.API.info("Push notification types: "+Titanium.Network.remoteNotificationTypes);
		Ti.API.info("Push notification enabled: "+Titanium.Network.remoteNotificationsEnabled);
	};
		
	function error(e) {
		label.text = "Error during registration: "+e.error;
	};
		
	function callback(e) {
		// called when a push notification is received.
		alert("Received a push notification\n\nPayload:\n\n"+JSON.stringify(e.data));
	};
	
	// register for push notifications
	if (Ti.Platform.version >= 8) {
		
  		Ti.App.iOS.addEventListener('usernotificationsettings', 
  			function registerForPush() { 
  				Ti.App.iOS.removeEventListener('usernotificationsettings', registerForPush); 
 				Ti.Network.registerForPushNotifications({
					success: success,
					error: error,
					callback: callback
	        });
	    });
	 
	    // Register notification types to use
	    Ti.App.iOS.registerUserNotificationSettings({
		    types: [
				Ti.App.iOS.USER_NOTIFICATION_TYPE_ALERT,
				Ti.App.iOS.USER_NOTIFICATION_TYPE_SOUND,
				Ti.App.iOS.USER_NOTIFICATION_TYPE_BADGE
	        ]
	       
	    });
   		
	} else { 
		
		Titanium.Network.registerForPushNotifications({
			types: [
				Titanium.Network.NOTIFICATION_TYPE_BADGE,
				Titanium.Network.NOTIFICATION_TYPE_ALERT,
				Titanium.Network.NOTIFICATION_TYPE_SOUND
			],
				success: success,
				error: error,
				callback: callback
		});	
	}
	
	return win;
};

module.exports = push_notifications;