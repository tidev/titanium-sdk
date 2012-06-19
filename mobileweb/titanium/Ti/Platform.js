define(["Ti/_", "Ti/_/browser", "Ti/_/Evented", "Ti/_/lang", "Ti/Locale", "Ti/_/dom", "Ti/UI"],
	function(_, browser, Evented, lang, Locale, dom, UI) {
		
	var doc = document,
		midName = "ti:mid",
		matches = doc.cookie.match(new RegExp("(?:^|; )" + midName + "=([^;]*)")),
		mid = matches ? decodeURIComponent(matches[1]) : void 0,
		unloaded,
		on = require.on,
		hiddenIFrame = dom.create("iframe",{id: "urlOpener", style: {display: "none"} },doc.body);

	mid || (mid = localStorage.getItem(midName));
	mid || localStorage.setItem(midName, mid = _.uuid());

	function saveMid() {
		if (!unloaded) {
			unloaded = 1;
			// expire cookie in 20 years... forever in mobile terms
			doc.cookie = midName + "=" + encodeURIComponent(mid) + "; expires=" + (new Date(Date.now() + 63072e7)).toUTCString();
			localStorage.setItem(midName, mid);
		}
	}
 
	on(window, "beforeunload", saveMid);
	on(window, "unload", saveMid);

	var nav = navigator,
		battery = nav.battery || nav.webkitBattery || nav.mozBattery,
		Platform = lang.setObject("Ti.Platform", Evented, {

			canOpenURL: function(url) {
				return !!url;
			},

			createUUID: _.uuid,

			is24HourTimeFormat: function() {
				return false;
			},

			openURL: function(url){
				if (/^([tel|sms|mailto])/.test(url)) {
					hiddenIFrame.contentWindow.location.href = url;
				} else { 
					var win = UI.createWindow({
							layout: UI._LAYOUT_CONSTRAINING_VERTICAL,
							backgroundColor: "#888"
						}),
						backButton = UI.createButton({
							top: 2,
							bottom: 2,
							title: "Close"
						}),
						webview = UI.createWebView({
							width: UI.FILL,
							height: UI.FILL
						});
					backButton.addEventListener("singletap", function(){
						win.close();
					});
					win.add(backButton);
					win.add(webview);
					win.open();
					setTimeout(function(){
						webview.url = url;
					}, 1);
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
				address: void 0,
				architecture: void 0,
				availableMemory: void 0,
				batteryLevel: function() {
					return this.batteryMonitoring && battery ? battery.level * 100 : -1;
				},
				batteryState: function() {
					return this.batteryMonitoring && battery && battery.charging ? this.BATTERY_STATE_CHARGING : this.BATTERY_STATE_UNKNOWN;
				},
				isBrowser: true,
				id: mid,
				locale: Locale,
				macaddress: void 0,
				model: nav.userAgent,
				name: "mobileweb",
				netmask: void 0,
				osname: "mobileweb",
				ostype: nav.platform,
				runtime: browser.runtime,
				processorCount: void 0,
				username: void 0,
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
