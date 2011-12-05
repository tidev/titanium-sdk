(function(api){
	// Interfaces
	Ti._5.EventDriven(api);

	// Properties
	Ti._5.prop(api, 'cancelAllLocalNotifications');

	Ti._5.prop(api, 'cancelLocalNotification');

	Ti._5.prop(api, 'registerBackgroundService');

	Ti._5.prop(api, 'scheduleLocalNotification');

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