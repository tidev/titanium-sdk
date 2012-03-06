define(["Ti/_/Evented", "Ti/_/lang"], function(Evented, lang) {
	
	var api,
		on = require.on,
		compassSupport = false,
		currentHeading,
		removeHeadingEventListener,
		locationWatchId,
		currentLocation,
		numHeadingEventListeners = 0,
		numLocationEventListeners = 0;
	
	function singleShotHeading(callback) {
		var removeOrientation = on(window,"deviceorientation",function(e) {
			removeOrientation();
			callback(e);
		});
	}
	singleShotHeading(function(e) {
		lang.isDef(e.webkitCompassHeading) && (compassSupport = true);
	});
	function createHeadingCallback(callback) {
		return function(e) {
			currentHeading = {
				heading: {
					accuracy: e.webkitCompassAccuracy,
					magneticHeading: e.webkitCompassHeading
				},
				success: true,
				timestamp: (new Date()).getTime()
				
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
	
	api = lang.setObject("Ti.Geolocation", Evented, {
		
		getCurrentPosition: function(callback) {
			if (api.locationServicesEnabled) {
				navigator.geolocation.getCurrentPosition(
					createLocationCallback(callback),
					createLocationCallback(callback),
					{
						enableHighAccuracy: api.accuracy === api.ACCURACY_BEST,
						timeout: api.MobileWeb.timeout,
						maximumAge: api.MobileWeb.maximumLocationAge
					}
				);
			}
		},
		
		getCurrentHeading: function(callback) {
			if (compassSupport) {
				if (currentHeading && (new Date()).getTime() - currentHeading.timestamp < api.maximumHeadingAge) {
					callback(currentHeading);
				} else {
					singleShotHeading(createHeadingCallback(callback));
				}
			}
		},
		
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
								{
									enableHighAccuracy: api.accuracy === api.ACCURACY_BEST,
									timeout: api.MobileWeb.timeout,
									maximumAge: api.MobileWeb.maximumLocationAge
								}
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
			
			ACCURACY_BEST: 1,
			
			ACCURACY_LOW: 2,
			
			locationServicesEnabled: {
				get: function() {
					return !!navigator.geolocation;
				}
			},
			
			MobileWeb: {
				timeout: Infinity,
				maximumLocationAge: 0,
				maximumHeadingAge: 1000,
				ERROR_PERMISSION_DENIED: 1,
				ERROR_POSITION_UNAVAILABLE: 2,
				ERROR_TIMEOUT: 3
			}
			
		},
	
		properties: {
			accuracy: 2
		}
	
	});
	return api;

});