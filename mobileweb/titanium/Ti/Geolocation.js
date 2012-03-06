define(["Ti/_/Evented", "Ti/_/lang"], function(Evented, lang) {
	
	var api = lang.setObject("Ti.Geolocation", Evented, {
		
		getCurrentPosition: function(callback) {
			if (api.locationServicesEnabled) {
				navigator.geolocation.getCurrentPosition(
					function(position) { // success callback
						var locationEvent = {
							coords: position.coords,
							success: true
						}
						api.fireEvent("location", locationEvent);
						callback(locationEvent);
					},
					function(error) { // error callback
						var locationEvent = {
							code: error.code,
							success: false
						}
						api.fireEvent("location", locationEvent);
						callback(locationEvent);
					},
					{
						enableHighAccuracy: api.accuracy === api.ACCURACY_BEST,
						timeout: api.MobileWeb.timeout,
						maximumAge: api.MobileWeb.maximumAge
					}
				);
			}
		},
		
		forwardGeocoder: function(address, callback) {
			console.debug('Method "Ti.Geolocation#forwardGeocoder" is not implemented yet.');
		},
		
		getCurrentHeading: function(callback) {
			console.debug('Method "Ti.Geolocation#getCurrentHeading" is not implemented yet.');
		},
		
		reverseGeocoder: function(latitude, longitude, callback) {
			console.debug('Method "Ti.Geolocation#reverseGeocoder" is not implemented yet.');
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
				maximumAge: 0,
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