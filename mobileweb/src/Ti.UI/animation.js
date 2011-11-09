Ti._5.createClass('Titanium.UI.Animation', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'animation', args, 'Animation');
	Ti._5.Positionable(this, args);

	// Properties
	var _autoreverse = null;
	Object.defineProperty(this, 'autoreverse', {
		get: function(){return _autoreverse;},
		set: function(val){return _autoreverse = val;}
	});

	var _backgroundColor = null;
	Object.defineProperty(this, 'backgroundColor', {
		get: function(){return _backgroundColor;},
		set: function(val){return _backgroundColor = val;}
	});

	var _color = null;
	Object.defineProperty(this, 'color', {
		get: function(){return _color;},
		set: function(val){return _color = val;}
	});

	var _curve = null;
	Object.defineProperty(this, 'curve', {
		get: function(){return _curve;},
		set: function(val){return _curve = val;}
	});

	var _delay = null;
	Object.defineProperty(this, 'delay', {
		get: function(){return _delay;},
		set: function(val){return _delay = val;}
	});

	var _duration = null;
	Object.defineProperty(this, 'duration', {
		get: function(){return _duration;},
		set: function(val){return _duration = val;}
	});

	var _opacity = null;
	Object.defineProperty(this, 'opacity', {
		get: function(){return _opacity;},
		set: function(val){return _opacity = val;}
	});

	var _opaque = null;
	Object.defineProperty(this, 'opaque', {
		get: function(){return _opaque;},
		set: function(val){return _opaque = val;}
	});

	var _repeat = null;
	Object.defineProperty(this, 'repeat', {
		get: function(){return _repeat;},
		set: function(val){return _repeat = val;}
	});

	var _transform = null;
	Object.defineProperty(this, 'transform', {
		get: function(){return _transform;},
		set: function(val){return _transform = val;}
	});

	var _transition = null;
	Object.defineProperty(this, 'transition', {
		get: function(){return _transition;},
		set: function(val){return _transition = val;}
	});

	var _visible = null;
	Object.defineProperty(this, 'visible', {
		get: function(){return _visible;},
		set: function(val){return _visible = val;}
	});

	var _zIndex = null;
	Object.defineProperty(this, 'zIndex', {
		get: function(){return _zIndex;},
		set: function(val){return _zIndex = val;}
	});


	// Events
	this.addEventListener('complete', function(){
		console.debug('Event "complete" is not implemented yet.');
	});
	this.addEventListener('start', function(){
		console.debug('Event "start" is not implemented yet.');
	});

	Ti._5.presetUserDefinedElements(this, args);
});