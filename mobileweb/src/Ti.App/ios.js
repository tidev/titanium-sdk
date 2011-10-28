(function(api){
	// Interfaces
	Ti._5.EventDriven(api);

	// Properties
	var _cancelAllLocalNotifications = null;
	Object.defineProperty(api, 'cancelAllLocalNotifications', {
		get: function(){return _cancelAllLocalNotifications;},
		set: function(val){return _cancelAllLocalNotifications = val;}
	});

	var _cancelLocalNotification = null;
	Object.defineProperty(api, 'cancelLocalNotification', {
		get: function(){return _cancelLocalNotification;},
		set: function(val){return _cancelLocalNotification = val;}
	});

	var _registerBackgroundService = null;
	Object.defineProperty(api, 'registerBackgroundService', {
		get: function(){return _registerBackgroundService;},
		set: function(val){return _registerBackgroundService = val;}
	});

	var _scheduleLocalNotification = null;
	Object.defineProperty(api, 'scheduleLocalNotification', {
		get: function(){return _scheduleLocalNotification;},
		set: function(val){return _scheduleLocalNotification = val;}
	});

	// Methods
	api.createBackgroundService = function(){
		console.debug('Method "Titanium.App.iOS.createBackgroundService" is not implemented yet.');
	};
	api.createLocalNotification = function(){
		console.debug('Method "Titanium.App.iOS.createLocalNotification" is not implemented yet.');
	};

	// Events
	api.addEventListener('notification', function(){
		console.debug('Event "notification" is not implemented yet.');
	});
})(Ti._5.createClass('Titanium.App.iOS'));