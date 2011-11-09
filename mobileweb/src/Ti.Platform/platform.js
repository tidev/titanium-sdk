(function(api){
	// Interfaces
	Ti._5.EventDriven(api);

	// Properties
	api.isBrowser = true;

	api.BATTERY_STATE_CHARGING = 1;
	api.BATTERY_STATE_FULL = 2;
	api.BATTERY_STATE_UNKNOWN = -1;
	api.BATTERY_STATE_UNPLUGGED = 0;
	
	var _address = null;
	Object.defineProperty(api, 'address', {
		get: function(){return _address;},
		set: function(val){return _address = val;}
	});

	var _architecture = null;
	Object.defineProperty(api, 'architecture', {
		get: function(){return _architecture;},
		set: function(val){return _architecture = val;}
	});

	var _availableMemory = null;
	Object.defineProperty(api, 'availableMemory', {
		get: function(){return _availableMemory;},
		set: function(val){return _availableMemory = val;}
	});

	var _batteryLevel = null;
	Object.defineProperty(api, 'batteryLevel', {
		get: function(){return _batteryLevel;},
		set: function(val){return _batteryLevel = val;}
	});

	var _batteryMonitoring = false;
	Object.defineProperty(api, 'batteryMonitoring', {
		get: function(){return _batteryMonitoring;},
		set: function(val){return _batteryMonitoring=val ? true : false;}
	});
	
	var _batteryState = api.BATTERY_STATE_UNKNOWN;
	Object.defineProperty(api, 'batteryState', {
		get: function(){return _batteryState;},
		set: function(val){return false;}
	});

	Object.defineProperty(api, 'displayCaps', {
		get: function(){return Titanium.Platform.DisplayCaps;},
		set: function(val){return false;}
	});

	Object.defineProperty(api, 'locale', {
		get: function(){return navigator.language;},
		set: function(val){return false;}
	});

	var _macaddress = null;
	Object.defineProperty(api, 'macaddress', {
		get: function(){return _macaddress;},
		set: function(val){return _macaddress = val;}
	});

	var _model = null;
	Object.defineProperty(api, 'model', {
		get: function(){return _model;},
		set: function(val){return false;}
	});

	Object.defineProperty(api, 'name', {
		get: function(){return navigator.userAgent;},
		set: function(val){return false;}
	});

	var _netmask = null;
	Object.defineProperty(api, 'netmask', {
		get: function(){return _netmask;},
		set: function(val){return _netmask = val;}
	});

	Object.defineProperty(api, 'osname', {
		get: function(){return "mobileweb";},
		set: function(val){return false;}
	});

	Object.defineProperty(api, 'ostype', {
		get: function(){return navigator.platform;},
		set: function(val){return false;}
	});

	var match = navigator.userAgent.toLowerCase().match(/(webkit|gecko|trident|presto)/),
		runtime = match ? match[0] : "unknown";
	Object.defineProperty(api, 'runtime', {
		get: function(){return runtime;},
		set: function(val){return false;}
	});

	var _processorCount = null;
	Object.defineProperty(api, 'processorCount', {
		get: function(){return _processorCount;},
		set: function(val){return _processorCount = val;}
	});

	var _username = null;
	Object.defineProperty(api, 'username', {
		get: function(){return _username;},
		set: function(val){return _username = val;}
	});

	Object.defineProperty(api, 'version', {
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
	Object.defineProperty(api, 'id', {
		get: function(){return _id;},
		set: function(val){return false;}
	});

	// Events
	api.addEventListener('battery', function(){
		console.debug('Event "battery" is not implemented yet.');
	});
})(Ti._5.createClass('Titanium.Platform'));
