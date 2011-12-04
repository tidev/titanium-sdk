(function(api){
	// Interfaces
	Ti._5.EventDriven(api);

	// Properties
	api.isBrowser = true;

	api.BATTERY_STATE_CHARGING = 1;
	api.BATTERY_STATE_FULL = 2;
	api.BATTERY_STATE_UNKNOWN = -1;
	api.BATTERY_STATE_UNPLUGGED = 0;
	
	Ti._5.member(api, 'address');

	Ti._5.member(api, 'architecture');

	Ti._5.member(api, 'availableMemory');

	Ti._5.member(api, 'batteryLevel');

	var _batteryMonitoring = false;
	Ti._5.prop(api, 'batteryMonitoring', {
		get: function(){return _batteryMonitoring;},
		set: function(val){return _batteryMonitoring=val ? true : false;}
	});
	
	var _batteryState = api.BATTERY_STATE_UNKNOWN;
	Ti._5.prop(api, 'batteryState', {
		get: function(){return _batteryState;},
		set: function(val){return false;}
	});

	Ti._5.prop(api, 'displayCaps', {
		get: function(){return Titanium.Platform.DisplayCaps;},
		set: function(val){return false;}
	});

	Ti._5.prop(api, 'locale', {
		get: function(){return navigator.language;},
		set: function(val){return false;}
	});

	Ti._5.member(api, 'macaddress');

	var _model = null;
	Ti._5.prop(api, 'model', {
		get: function(){return _model;},
		set: function(val){return false;}
	});

	Ti._5.prop(api, 'name', {
		get: function(){return navigator.userAgent;},
		set: function(val){return false;}
	});

	Ti._5.member(api, 'netmask');

	Ti._5.prop(api, 'osname', {
		get: function(){return "mobileweb";},
		set: function(val){return false;}
	});

	Ti._5.prop(api, 'ostype', {
		get: function(){return navigator.platform;},
		set: function(val){return false;}
	});

	var match = navigator.userAgent.toLowerCase().match(/(webkit|gecko|trident|presto)/),
		runtime = match ? match[0] : "unknown";
	Ti._5.prop(api, 'runtime', {
		get: function(){return runtime;},
		set: function(val){return false;}
	});

	Ti._5.member(api, 'processorCount');

	Ti._5.member(api, 'username');

	Ti._5.prop(api, 'version', {
		get: function(){return Ti.version;},
		set: function(val){return false;}
	});

	// Methods
	api.canOpenURL = function(url){
		return true;
	};
	api.createUUID = function(){
		return Ti._5.createUUID();
	};

	api.openURL = function(url){
		window.open(url);
	};
	
	var _id = localStorage && localStorage.getItem("html5_titaniumPlatformId") ?
		localStorage.getItem("html5_titaniumPlatformId") : api.createUUID();
	localStorage.setItem("html5_titaniumPlatformId", _id);
	Ti._5.prop(api, 'id', {
		get: function(){return _id;},
		set: function(val){return false;}
	});

	// Events
	api.addEventListener('battery', function(){
		console.debug('Event "battery" is not implemented yet.');
	});
})(Ti._5.createClass('Titanium.Platform'));
