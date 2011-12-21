define("Ti/Platform", ["Ti/_", "Ti/_/browser", "Ti/_/Evented", "Ti/_/lang"], function(_, browser, Evented, lang) {

	var id = localStorage && localStorage.getItem("ti:titaniumPlatformId") ?
			localStorage.getItem("ti:titaniumPlatformId") : _.uuid();

	localStorage.setItem("ti:titaniumPlatformId", id);

	return lang.setObject("Ti.Platform", Evented, {

		createUUID: _.uuid,

		canOpenURL: function() {
			return true;
		},

		openURL: function(url){
			var m = /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?/.exec(url);
			if ( (/^([tel|sms|mailto])/.test(url) || /^([\/?#]|[\w\d-]+^:[\w\d]+^@)/.test(m[1])) && !/^(localhost)/.test(url) ) {
				setTimeout(function () {
					window.location.href = url;
				}, 1);
			} else {
				window.open(url);
			}
		},

		constants: {
			BATTERY_STATE_CHARGING: 1,
			BATTERY_STATE_FULL: 2,
			BATTERY_STATE_UNKNOWN: -1,
			BATTERY_STATE_UNPLUGGED: 0,
			address: null,
			architecture: null,
			availableMemory: null,
			batteryLevel: null,
			batteryMonitoring: null,
			batteryState: this.BATTERY_STATE_UNKNOWN,
			id: id,
			isBrowser: true,
			locale: navigator.language,
			macaddress: null,
			model: null,
			name: navigator.userAgent,
			netmask: null,
			osname: "mobileweb",
			ostype: navigator.platform,
			runtime: browser.runtime,
			processorCount: null,
			username: null,
			version: require.config.ti.version
		}

	});

});
