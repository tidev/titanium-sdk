(function(api){
	// Interfaces
	Ti._5.EventDriven(api);

	// Properties
	Ti._5.member(api, 'DEFAULT_ALL');

	Ti._5.member(api, 'DEFAULT_LIGHTS');

	Ti._5.member(api, 'DEFAULT_SOUND');

	Ti._5.member(api, 'DEFAULT_VIBRATE');

	Ti._5.member(api, 'FLAG_AUTO_CANCEL');

	Ti._5.member(api, 'FLAG_INSISTENT');

	Ti._5.member(api, 'FLAG_NO_CLEAR');

	Ti._5.member(api, 'FLAG_ONGOING_EVENT');

	Ti._5.member(api, 'FLAG_ONLY_ALERT_ONCE');

	Ti._5.member(api, 'FLAG_SHOW_LIGHTS');

	Ti._5.member(api, 'STREAM_DEFAULT');

	// Methods
	api.cancel = function(){
		console.debug('Method "Titanium.Android.NotificationManager.cancel" is not implemented yet.');
	};
	api.cancelAll = function(){
		console.debug('Method "Titanium.Android.NotificationManager.cancelAll" is not implemented yet.');
	};
	api.notify = function(){
		console.debug('Method "Titanium.Android.NotificationManager.notify" is not implemented yet.');
	};
})(Ti._5.createClass('Titanium.Android.NotificationManager'));