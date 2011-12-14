Ti._5.createClass("Ti.Map.MapView", function(api){
    var obj = this;

	// Interfaces
	Ti._5.DOMView(obj, "div", args, "MapView");
	Ti._5.Touchable(obj);
	Ti._5.Styleable(obj, args);
	Ti._5.Positionable(obj, args);

	// Properties
	Ti._5.prop(obj, {
		animate: null,
		annotations: null,
		location: null,
		mapType: null,
		region: null,
		regionFit: null,
		userLocation: null
	});

	// Methods
	obj.addAnnotation = function(){
		console.debug('Method "Titanium.Map.MapView.addAnnotation" is not implemented yet.');
	};
	obj.addAnnotations = function(){
		console.debug('Method "Titanium.Map.MapView.addAnnotations" is not implemented yet.');
	};
	obj.addRoute = function(){
		console.debug('Method "Titanium.Map.MapView.addRoute" is not implemented yet.');
	};
	obj.deselectAnnotation = function(){
		console.debug('Method "Titanium.Map.MapView.deselectAnnotation" is not implemented yet.');
	};
	obj.removeAllAnnotations = function(){
		console.debug('Method "Titanium.Map.MapView.removeAllAnnotations" is not implemented yet.');
	};
	obj.removeAnnotation = function(){
		console.debug('Method "Titanium.Map.MapView.removeAnnotation" is not implemented yet.');
	};
	obj.removeAnnotations = function(){
		console.debug('Method "Titanium.Map.MapView.removeAnnotations" is not implemented yet.');
	};
	obj.removeRoute = function(){
		console.debug('Method "Titanium.Map.MapView.removeRoute" is not implemented yet.');
	};
	obj.selectAnnotation = function(){
		console.debug('Method "Titanium.Map.MapView.selectAnnotation" is not implemented yet.');
	};
	obj.setLocation = function(){
		console.debug('Method "Titanium.Map.MapView.setLocation" is not implemented yet.');
	};
	obj.setMapType = function(){
		console.debug('Method "Titanium.Map.MapView.setMapType" is not implemented yet.');
	};
	obj.zoom = function(){
		console.debug('Method "Titanium.Map.MapView.zoom" is not implemented yet.');
	};

	// Events
	obj.addEventListener("complete", function(){
		console.debug('Event "complete" is not implemented yet.');
	});
	obj.addEventListener("error", function(){
		console.debug('Event "error" is not implemented yet.');
	});
	obj.addEventListener("loading", function(){
		console.debug('Event "loading" is not implemented yet.');
	});
	obj.addEventListener("regionChanged", function(){
		console.debug('Event "regionChanged" is not implemented yet.');
	});
});