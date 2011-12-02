Ti._5.createClass('Titanium.UI.iPad.Popover', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'ipad.popover', args, 'iPad.Popover');
	Ti._5.Touchable(this);
	Ti._5.Styleable(this, args);
	Ti._5.Positionable(this, args);

	// Properties
	Ti._5.member(this, 'arrowDirection');

	Ti._5.member(this, 'leftNavButton');

	Ti._5.member(this, 'title');

	// Methods
	this.setHeight = function(){
		console.debug('Method "Titanium.UI.iPad.Popover#.setHeight" is not implemented yet.');
	};
	this.setWidth = function(){
		console.debug('Method "Titanium.UI.iPad.Popover#.setWidth" is not implemented yet.');
	};

	// Events
	this.addEventListener('hide', function(){
		console.debug('Event "hide" is not implemented yet.');
	});

	require.mix(this, args);
});