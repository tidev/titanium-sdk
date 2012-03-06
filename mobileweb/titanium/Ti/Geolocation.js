define(["Ti/_/Evented", "Ti/_/lang"], function(Evented, lang) {
	
	return lang.setObject("Ti.Geolocation", Evented, {
		
		getCurrentPosition: function(callback) {
			console.debug('Method "Ti.Geolocation#getCurrentPosition" is not implemented yet.');
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
			
			locationServicesEnabled: function() {
				console.debug('Constant "Ti.Geolocation#locationServicesEnabled" is not implemented yet.');
			}
			
		},
	
		properties: {
			accuracy: {
				get: function(value) {
					console.debug('Property "Ti.Geolocation#accuracy" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Ti.Geolocation#accuracy" is not implemented yet.');
					return value;
				}
			},
			value: ACCURACY_LOW
		}
	
	});

});