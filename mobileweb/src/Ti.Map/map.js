(function(api){
	// Interfaces
	Ti._5.EventDriven(api);

	// Properties
	var _HYBRID_TYPE = null;
	Object.defineProperty(api, 'HYBRID_TYPE', {
		get: function(){return _HYBRID_TYPE;},
		set: function(val){return _HYBRID_TYPE = val;}
	});

	var _SATELLITE_TYPE = null;
	Object.defineProperty(api, 'SATELLITE_TYPE', {
		get: function(){return _SATELLITE_TYPE;},
		set: function(val){return _SATELLITE_TYPE = val;}
	});

	var _STANDARD_TYPE = null;
	Object.defineProperty(api, 'STANDARD_TYPE', {
		get: function(){return _STANDARD_TYPE;},
		set: function(val){return _STANDARD_TYPE = val;}
	});

	// Methods
	api.createAnnotation = function(){
		console.debug('Method "Titanium.Map.createAnnotation" is not implemented yet.');
	};
	api.createMapView = function(){
		console.debug('Method "Titanium.Map.createMapView" is not implemented yet.');
	};
})(Ti._5.createClass('Titanium.Map'));