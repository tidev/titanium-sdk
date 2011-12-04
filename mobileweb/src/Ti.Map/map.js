(function(api){
	// Interfaces
	Ti._5.EventDriven(api);

	// Properties
	Ti._5.member(api, 'HYBRID_TYPE');

	Ti._5.member(api, 'SATELLITE_TYPE');

	Ti._5.member(api, 'STANDARD_TYPE');

	// Methods
	api.createAnnotation = function(){
		console.debug('Method "Titanium.Map.createAnnotation" is not implemented yet.');
	};
	api.createMapView = function(){
		console.debug('Method "Titanium.Map.createMapView" is not implemented yet.');
	};
})(Ti._5.createClass('Titanium.Map'));