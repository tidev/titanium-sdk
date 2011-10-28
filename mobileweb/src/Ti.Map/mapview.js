Ti._5.createClass('Titanium.Map.MapView', function(api){
    var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'div', args, 'MapView');
	Ti._5.Touchable(this);
	Ti._5.Styleable(this, args);
	Ti._5.Positionable(this, args);

	// Properties
	var _animate = null;
	Object.defineProperty(this, 'animate', {
		get: function(){return _animate;},
		set: function(val){return _animate = val;}
	});

	var _annotations = null;
	Object.defineProperty(this, 'annotations', {
		get: function(){return _annotations;},
		set: function(val){return _annotations = val;}
	});

	var _location = null;
	Object.defineProperty(this, 'location', {
		get: function(){return _location;},
		set: function(val){return _location = val;}
	});

	var _mapType = null;
	Object.defineProperty(this, 'mapType', {
		get: function(){return _mapType;},
		set: function(val){return _mapType = val;}
	});

	var _region = null;
	Object.defineProperty(this, 'region', {
		get: function(){return _region;},
		set: function(val){return _region = val;}
	});

	var _regionFit = null;
	Object.defineProperty(this, 'regionFit', {
		get: function(){return _regionFit;},
		set: function(val){return _regionFit = val;}
	});

	var _userLocation = null;
	Object.defineProperty(this, 'userLocation', {
		get: function(){return _userLocation;},
		set: function(val){return _userLocation = val;}
	});

	// Methods
	this.addAnnotation = function(){
		console.debug('Method "Titanium.Map.MapView.addAnnotation" is not implemented yet.');
	};
	this.addAnnotations = function(){
		console.debug('Method "Titanium.Map.MapView.addAnnotations" is not implemented yet.');
	};
	this.addRoute = function(){
		console.debug('Method "Titanium.Map.MapView.addRoute" is not implemented yet.');
	};
	this.deselectAnnotation = function(){
		console.debug('Method "Titanium.Map.MapView.deselectAnnotation" is not implemented yet.');
	};
	this.removeAllAnnotations = function(){
		console.debug('Method "Titanium.Map.MapView.removeAllAnnotations" is not implemented yet.');
	};
	this.removeAnnotation = function(){
		console.debug('Method "Titanium.Map.MapView.removeAnnotation" is not implemented yet.');
	};
	this.removeAnnotations = function(){
		console.debug('Method "Titanium.Map.MapView.removeAnnotations" is not implemented yet.');
	};
	this.removeRoute = function(){
		console.debug('Method "Titanium.Map.MapView.removeRoute" is not implemented yet.');
	};
	this.selectAnnotation = function(){
		console.debug('Method "Titanium.Map.MapView.selectAnnotation" is not implemented yet.');
	};
	this.setLocation = function(){
		console.debug('Method "Titanium.Map.MapView.setLocation" is not implemented yet.');
	};
	this.setMapType = function(){
		console.debug('Method "Titanium.Map.MapView.setMapType" is not implemented yet.');
	};
	this.zoom = function(){
		console.debug('Method "Titanium.Map.MapView.zoom" is not implemented yet.');
	};

	// Events
	this.addEventListener('complete', function(){
		console.debug('Event "complete" is not implemented yet.');
	});
	this.addEventListener('error', function(){
		console.debug('Event "error" is not implemented yet.');
	});
	this.addEventListener('loading', function(){
		console.debug('Event "loading" is not implemented yet.');
	});
	this.addEventListener('regionChanged', function(){
		console.debug('Event "regionChanged" is not implemented yet.');
	});
});