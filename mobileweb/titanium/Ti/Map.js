define("Ti/Map", ["Ti/_/Evented"], function(Evented) {
	
	(function(api){
		// Interfaces
		Ti._5.EventDriven(api);
	
		// Properties
		Ti._5.propReadOnly(api, {
			HYBRID_TYPE: 0,
			SATELLITE_TYPE: 1,
			STANDARD_TYPE: 2
		});
	
		// Methods
		api.createAnnotation = function(){
			console.debug('Method "Titanium.Map.createAnnotation" is not implemented yet.');
		};
		api.createMapView = function(){
			console.debug('Method "Titanium.Map.createMapView" is not implemented yet.');
		};
	})(Ti._5.createClass('Ti.Map'));

});