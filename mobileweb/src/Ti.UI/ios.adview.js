Ti._5.createClass('Titanium.UI.iOS.AdView', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'ios.adview', args, 'iOS.AdView');
	Ti._5.Touchable(this);
	Ti._5.Styleable(this, args);
	Ti._5.Positionable(this, args);

	// Properties
	Ti._5.prop(this, 'SIZE_320x50');

	Ti._5.prop(this, 'SIZE_480x32');

	// Methods
	this.cancelAction = function(){
		console.debug('Method "Titanium.UI.iOS.AdView#.cancelAction" is not implemented yet.');
	};

	// Events
	this.addEventListener('action', function(){
		console.debug('Event "action" is not implemented yet.');
	});
	this.addEventListener('error', function(){
		console.debug('Event "error" is not implemented yet.');
	});
	this.addEventListener('load', function(){
		console.debug('Event "load" is not implemented yet.');
	});

	require.mix(this, args);
});