Ti._5.createClass('Titanium.UI.Animation', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'animation', args, 'Animation');
	Ti._5.Positionable(this, args);

	// Properties
	Ti._5.prop(this, 'autoreverse');

	Ti._5.prop(this, 'backgroundColor');

	Ti._5.prop(this, 'color');

	Ti._5.prop(this, 'curve');

	Ti._5.prop(this, 'delay');

	Ti._5.prop(this, 'duration');

	Ti._5.prop(this, 'opacity');

	Ti._5.prop(this, 'opaque');

	Ti._5.prop(this, 'repeat');

	Ti._5.prop(this, 'transform');

	Ti._5.prop(this, 'transition');

	Ti._5.prop(this, 'visible');

	Ti._5.prop(this, 'zIndex');


	// Events
	this.addEventListener('complete', function(){
		console.debug('Event "complete" is not implemented yet.');
	});
	this.addEventListener('start', function(){
		console.debug('Event "start" is not implemented yet.');
	});

	Ti._5.presetUserDefinedElements(this, args);
});