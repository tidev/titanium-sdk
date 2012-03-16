define(["Ti/_", "Ti/_/browser", "Ti/_/Evented", "Ti/_/lang", "Ti/Locale"],
	function(_, browser, Evented, lang, Locale) {
		
	var midName = "ti_mid",
		matches = document.cookie.match(new RegExp("(?:^|; )" + midName + "=([^;]*)")),
		mid = matches ? decodeURIComponent(matches[1]) : undefined,
		unloaded,
		on = require.on;

	mid || (mid = localStorage.getItem(midName));
	mid || localStorage.setItem(midName, mid = _.uuid());

	function saveMid() {
		if (!unloaded) {
			unloaded = 1;
			var d = new Date();
			d.setTime(d.getTime() + 63072e7); // forever in mobile terms
			doc.cookie = midName + "=" + encodeURIComponent(mid) + "; expires=" + d.toUTCString();
			localStorage.setItem(midName, mid);
		}
	}
 
	on(window, "beforeunload", saveMid);
	on(window, "unload", saveMid);

	var undef,
		nav = navigator,
		battery = nav.battery || nav.webkitBattery || nav.mozBattery,
		Platform = lang.setObject("Ti.Platform", Evented, {

			canOpenURL: function() {
				return true;
			},

			createUUID: _.uuid,

			openURL: function(url){
				var m = /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?/.exec(url);
				if ( (/^([tel|sms|mailto])/.test(url) || /^([\/?#]|[\w\d-]+^:[\w\d]+^@)/.test(m[1])) && !/^(localhost)/.test(url) ) {
					setTimeout(function() {
						window.location.href = url;
					}, 1);
				} else {
					window.open(url);
				}
			},

			properties: {
				batteryMonitoring: false
			},

			constants: {
				BATTERY_STATE_CHARGING: 1,
				BATTERY_STATE_FULL: 2,
				BATTERY_STATE_UNKNOWN: -1,
				BATTERY_STATE_UNPLUGGED: 0,
				address: undef,
				architecture: undef,
				availableMemory: undef,
				batteryLevel: function() {
					return this.batteryMonitoring && battery ? battery.level * 100 : -1;
				},
				batteryState: function() {
					return this.batteryMonitoring && battery && battery.charging ? this.BATTERY_STATE_CHARGING : this.BATTERY_STATE_UNKNOWN;
				},
				isBrowser: true,
				id: mid,
				locale: Locale,
				macaddress: undef,
				model: undef,
				name: nav.userAgent,
				netmask: undef,
				osname: "mobileweb",
				ostype: nav.platform,
				runtime: browser.runtime,
				processorCount: undef,
				username: undef,
				version: require.config.ti.version
			}

		});

	battery && require.on(battery, "chargingchange", function() {
		Platform.batteryMonitoring && Platform.fireEvent("battery", {
			level: Platform.batteryLevel,
			state: Platform.batteryState
		});
	});

	return Platform;

});
