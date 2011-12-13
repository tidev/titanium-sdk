(function(api){

	var match = navigator.userAgent.toLowerCase().match(/(webkit|gecko|trident|presto)/),
		runtime = match ? match[0] : "unknown",
		createUUID = Ti._5.createUUID,
		id = localStorage && localStorage.getItem("html5_titaniumPlatformId") ?
			localStorage.getItem("html5_titaniumPlatformId") : createUUID();

	// Interfaces
	Ti._5.EventDriven(api);

	// Properties
	Ti._5.propReadOnly(api, {
		BATTERY_STATE_CHARGING: 1,
		BATTERY_STATE_FULL: 2,
		BATTERY_STATE_UNKNOWN: -1,
		BATTERY_STATE_UNPLUGGED: 0,
		address: null,
		architecture: null,
		availableMemory: null,
		batteryLevel: null,
		batteryMonitoring: null,
		batteryState: api.BATTERY_STATE_UNKNOWN,
		id: id,
		isBrowser: true,
		locale: navigator.language,
		macaddress: null,
		model: null,
		name: navigator.userAgent,
		netmask: null,
		osname: "mobileweb",
		ostype: navigator.platform,
		runtime: runtime,
		processorCount: null,
		username: null,
		version: require.config.ti.version
	});

	// Methods
	api.canOpenURL = function(url){
		return true;
	};

	api.createUUID = createUUID;

	api.openURL = function(url){
		window.open(url);
	};

	localStorage.setItem("html5_titaniumPlatformId", id);

})(Ti._5.createClass("Ti.Platform"));
