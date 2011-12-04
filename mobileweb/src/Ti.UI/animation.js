Ti._5.createClass('Titanium.UI.Animation', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'animation', args, 'Animation');
	Ti._5.Positionable(this, args);

	// Properties
	Ti._5.member(this, 'autoreverse');

	Ti._5.member(this, 'backgroundColor');

	Ti._5.member(this, 'color');

	Ti._5.member(this, 'curve');

	Ti._5.member(this, 'delay');

	Ti._5.member(this, 'duration');

	Ti._5.member(this, 'opacity');

	Ti._5.member(this, 'opaque');

	Ti._5.member(this, 'repeat');

	Ti._5.member(this, 'transform');

	Ti._5.member(this, 'transition');

	Ti._5.member(this, 'visible');

	Ti._5.member(this, 'zIndex');


	// Events
	this.addEventListener('complete', function(){
		console.debug('Event "complete" is not implemented yet.');
	});
	this.addEventListener('start', function(){
		console.debug('Event "start" is not implemented yet.');
	});

	Ti._5.presetUserDefinedElements(this, args);
});