Ti._5.createClass('Titanium.UI.iPad.Popover', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'ipad.popover', args, 'iPad.Popover');
	Ti._5.Touchable(this);
	Ti._5.Styleable(this, args);
	Ti._5.Positionable(this, args);

	// Properties
	var _arrowDirection = null;
	Object.defineProperty(this, 'arrowDirection', {
		get: function(){return _arrowDirection;},
		set: function(val){return _arrowDirection = val;}
	});

	var _leftNavButton = null;
	Object.defineProperty(this, 'leftNavButton', {
		get: function(){return _leftNavButton;},
		set: function(val){return _leftNavButton = val;}
	});

	var _title = null;
	Object.defineProperty(this, 'title', {
		get: function(){return _title;},
		set: function(val){return _title = val;}
	});

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

	Ti._5.presetUserDefinedElements(this, args);
});