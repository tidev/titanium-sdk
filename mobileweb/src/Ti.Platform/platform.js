(function(api){
	// Interfaces
	Ti._5.EventDriven(api);

	// Properties
	api.isBrowser = true;

	api.BATTERY_STATE_CHARGING = 1;
	api.BATTERY_STATE_FULL = 2;
	api.BATTERY_STATE_UNKNOWN = -1;
	api.BATTERY_STATE_UNPLUGGED = 0;
	
	Ti._5.propReadOnly(api, 'address');

	Ti._5.propReadOnly(api, 'architecture');

	Ti._5.propReadOnly(api, 'availableMemory');

	Ti._5.propReadOnly(api, 'batteryLevel');

	Ti._5.propReadOnly(api, 'batteryMonitoring', false);
	
	Ti._5.propReadOnly(api, 'batteryState', api.BATTERY_STATE_UNKNOWN);

	Ti._5.propReadOnly(api, 'locale', navigator.language);

	Ti._5.propReadOnly(api, 'macaddress');

	Ti._5.propReadOnly(api, 'model');

	Ti._5.propReadOnly(api, 'name', navigator.userAgent);

	Ti._5.propReadOnly(api, 'netmask');

	Ti._5.propReadOnly(api, 'osname', "mobileweb");

	Ti._5.propReadOnly(api, 'ostype', navigator.platform);

	var match = navigator.userAgent.toLowerCase().match(/(webkit|gecko|trident|presto)/),
		runtime = match ? match[0] : "unknown";
	Ti._5.propReadOnly(api, 'runtime', runtime);

	Ti._5.propReadOnly(api, 'processorCount');

	Ti._5.propReadOnly(api, 'username');

	Ti._5.propReadOnly(api, 'version', Ti.version);

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
	Ti._5.propReadOnly(api, 'id', _id);

	// Events
	api.addEventListener('battery', function(){
		console.debug('Event "battery" is not implemented yet.');
	});
})(Ti._5.createClass('Titanium.Platform'));
