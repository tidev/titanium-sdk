(function(api){
	// Interfaces
	Ti._5.EventDriven(api);

	// Properties
	var _DEFAULT_ALL = null;
	Object.defineProperty(api, 'DEFAULT_ALL', {
		get: function(){return _DEFAULT_ALL;},
		set: function(val){return _DEFAULT_ALL = val;}
	});

	var _DEFAULT_LIGHTS = null;
	Object.defineProperty(api, 'DEFAULT_LIGHTS', {
		get: function(){return _DEFAULT_LIGHTS;},
		set: function(val){return _DEFAULT_LIGHTS = val;}
	});

	var _DEFAULT_SOUND = null;
	Object.defineProperty(api, 'DEFAULT_SOUND', {
		get: function(){return _DEFAULT_SOUND;},
		set: function(val){return _DEFAULT_SOUND = val;}
	});

	var _DEFAULT_VIBRATE = null;
	Object.defineProperty(api, 'DEFAULT_VIBRATE', {
		get: function(){return _DEFAULT_VIBRATE;},
		set: function(val){return _DEFAULT_VIBRATE = val;}
	});

	var _FLAG_AUTO_CANCEL = null;
	Object.defineProperty(api, 'FLAG_AUTO_CANCEL', {
		get: function(){return _FLAG_AUTO_CANCEL;},
		set: function(val){return _FLAG_AUTO_CANCEL = val;}
	});

	var _FLAG_INSISTENT = null;
	Object.defineProperty(api, 'FLAG_INSISTENT', {
		get: function(){return _FLAG_INSISTENT;},
		set: function(val){return _FLAG_INSISTENT = val;}
	});

	var _FLAG_NO_CLEAR = null;
	Object.defineProperty(api, 'FLAG_NO_CLEAR', {
		get: function(){return _FLAG_NO_CLEAR;},
		set: function(val){return _FLAG_NO_CLEAR = val;}
	});

	var _FLAG_ONGOING_EVENT = null;
	Object.defineProperty(api, 'FLAG_ONGOING_EVENT', {
		get: function(){return _FLAG_ONGOING_EVENT;},
		set: function(val){return _FLAG_ONGOING_EVENT = val;}
	});

	var _FLAG_ONLY_ALERT_ONCE = null;
	Object.defineProperty(api, 'FLAG_ONLY_ALERT_ONCE', {
		get: function(){return _FLAG_ONLY_ALERT_ONCE;},
		set: function(val){return _FLAG_ONLY_ALERT_ONCE = val;}
	});

	var _FLAG_SHOW_LIGHTS = null;
	Object.defineProperty(api, 'FLAG_SHOW_LIGHTS', {
		get: function(){return _FLAG_SHOW_LIGHTS;},
		set: function(val){return _FLAG_SHOW_LIGHTS = val;}
	});

	var _STREAM_DEFAULT = null;
	Object.defineProperty(api, 'STREAM_DEFAULT', {
		get: function(){return _STREAM_DEFAULT;},
		set: function(val){return _STREAM_DEFAULT = val;}
	});

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