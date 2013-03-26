define(["Ti/_/Evented", "Ti/_/lang", "Ti/Network"], function(Evented, lang, Network) {
	
	var api,
		on = require.on,
		compassSupport = false,
		currentHeading,
		removeHeadingEventListener,
		locationWatchId,
		currentLocation,
		numHeadingEventListeners = 0,
		numLocationEventListeners = 0,
		isDef = lang.isDef;
	
	function singleShotHeading(callback) {
		var removeOrientation = on(window,"deviceorientation",function(e) {
			removeOrientation();
			callback(e);
		});
	}
	singleShotHeading(function(e) {
		isDef(e.webkitCompassHeading) && (compassSupport = true);
	});
	function createHeadingCallback(callback) {
		return function(e) {
			currentHeading = {
				heading: {
					accuracy: e.webkitCompassAccuracy,
					magneticHeading: e.webkitCompassHeading
				},
				success: true,
				timestamp: Date.now()
				
			};
			api.fireEvent("heading", currentHeading);
			callback && callback(currentHeading);
		}
	}
	
	function createLocationCallback(callback) {
		return function(e) {
			var success = "coords" in e;
			currentLocation = {
				success: success
			};
			success ? (currentLocation.coords = e.coords) : (currentLocation.code = e.code);
			api.fireEvent("location", currentLocation);
			callback && callback(currentLocation);
		}
	}
	function createLocationArguments() {
		return {
			enableHighAccuracy: api.accuracy === api.ACCURACY_HIGH,
			timeout: api.MobileWeb.locationTimeout,
			maximumAge: api.MobileWeb.maximumLocationAge
		}
	}
	
	api = lang.setObject("Ti.Geolocation", Evented, {
		
		getCurrentPosition: function(callback) {
			if (api.locationServicesEnabled) {
				navigator.geolocation.getCurrentPosition(
					createLocationCallback(callback),
					createLocationCallback(callback),
					createLocationArguments()
				);
			}
		},
		
		getCurrentHeading: function(callback) {
			if (compassSupport) {
				if (currentHeading && Date.now() - currentHeading.timestamp < api.maximumHeadingAge) {
					callback(currentHeading);
				} else {
					singleShotHeading(createHeadingCallback(callback));
				}
			}
		},
		
		forwardGeocoder: function(address, callback) {
			if (!require.is(address,"String")) {
				return;
			}
			var client = Ti.Network.createHTTPClient({
				onload : function(e) {
					var responseParts = this.responseText.split(",");
					callback({
						success: true,
						places: [{
							latitude: parseFloat(responseParts[2]),
							longitude: parseFloat(responseParts[3])
						}]
					});
				},
				onerror : function(e) {
					callback({
						success: false
					});
				},
				timeout : api.MobileWeb.forwardGeocoderTimeout
			});
			client.open("GET", "http://api.appcelerator.net/p/v1/geo?d=f&" + 
				// TODO "c=" + Locale.getCurrentCountry() + 
				"q=" + escape(address));
			client.send();
		},
		
		reverseGeocoder: function(latitude, longitude, callback) {
			if (!isDef(latitude) || !isDef(longitude)) {
				return;
			}
			var client = Ti.Network.createHTTPClient({
				onload : function(e) {
					callback(JSON.parse(this.responseText));
				},
				onerror : function(e) {
					callback({
						success: false
					});
				},
				timeout : api.MobileWeb.forwardGeocoderTimeout
			});
			client.open("GET", "http://api.appcelerator.net/p/v1/geo?d=r&" + 
				// TODO "c=" + Locale.getCurrentCountry() + 
				"q=" + latitude + "," + longitude);
			client.send();
		},
		
		// Hook in to add/remove event listener so that we can disable the geo and compass intervals
		addEventListener: function(name, handler) {
			switch(name) {
				case "heading": 
					if (compassSupport) {
						numHeadingEventListeners++;
						if (numHeadingEventListeners === 1) {
							removeHeadingEventListener = on(window,"deviceorientation",createHeadingCallback());
						}
					}
					break;
				case "location": {
					if (api.locationServicesEnabled) {
						numLocationEventListeners++;
						if (numLocationEventListeners === 1) {
							locationWatchId = navigator.geolocation.watchPosition(
								createLocationCallback(),
								createLocationCallback(),
								createLocationArguments()
							);
						}
					}
					break;
				}
			}
			Evented.addEventListener.call(this,name,handler);
		},
		
		removeEventListener: function(name, handler) {
			switch(name) {
				case "heading": 
					if (compassSupport) {
						numHeadingEventListeners--;
						if (numHeadingEventListeners === 0) {
							removeHeadingEventListener();
						}
					}
					break;
				case "location": {
					if (api.locationServicesEnabled) {
						numLocationEventListeners--;
						if (numHeadingEventListeners < 1) {
							navigator.geolocation.clearWatch(locationWatchId);
						}
					}
					break;
				}
			}
			Evented.removeEventListener.call(this,name,handler);
		},
		
		constants: {
			
			ACCURACY_HIGH: 1,
			
			ACCURACY_LOW: 2,
			
			ERROR_DENIED: 1,
			
			ERROR_LOCATION_UNKNOWN: 2,
			
			ERROR_TIMEOUT: 3,
			
			locationServicesEnabled: {
				get: function() {
					return !!navigator.geolocation;
				}
			},
			
			MobileWeb: {
				locationTimeout: Infinity,
				maximumLocationAge: 0,
				maximumHeadingAge: 1000,
				forwardGeocoderTimeout: void 0,
				reverseGeocoderTimeout: void 0
			},

			hasCompass: function() {
				return compassSupport;
			}
			
		},
	
		properties: {
			accuracy: 2
		}
	
	});
	return api;

});