/**
 * this is a background service and this code will run *every* time the 
 * application goes into the foreground
 */
Ti.API.info("hello from a background service");

var notification = Ti.App.iOS.scheduleLocalNotification({
	alertBody:"Kitchen Sink was put in background",
	alertAction:"Re-Launch!",
	userInfo:{"hello":"world"},
	sound:"pop.caf",
	date:new Date(new Date().getTime() + 3000) // 3 seconds after backgrounding
});

// we cancel our notification if we don't want it to continue
// notification.cancel(); 

Ti.App.iOS.addEventListener('notification',function(){
	Ti.API.info('background event received = '+notification);
	Ti.App.currentService.unregister();
});

Ti.App.currentService.addEventListener('stop',function()
{
	Ti.API.info("background service is stopped");
});

// we need to explicitly stop the service or it will continue to run
// you should only stop it if you aren't listening for notifications in the background
// to conserve system resources. you can stop like this:
Ti.App.currentService.stop();


// you can unregister the service by calling 
// Ti.App.currentService.unregister() 
// and this service will be unregistered and never invoked again
