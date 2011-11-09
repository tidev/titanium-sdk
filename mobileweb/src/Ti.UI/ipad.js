Ti._5.createClass('Titanium.UI.iPad', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'ipad', args, 'iPad');

	// Properties
	var _POPOVER_ARROW_DIRECTION_ANY = null;
	Object.defineProperty(this, 'POPOVER_ARROW_DIRECTION_ANY', {
		get: function(){return _POPOVER_ARROW_DIRECTION_ANY;},
		set: function(val){return _POPOVER_ARROW_DIRECTION_ANY = val;}
	});

	var _POPOVER_ARROW_DIRECTION_DOWN = null;
	Object.defineProperty(this, 'POPOVER_ARROW_DIRECTION_DOWN', {
		get: function(){return _POPOVER_ARROW_DIRECTION_DOWN;},
		set: function(val){return _POPOVER_ARROW_DIRECTION_DOWN = val;}
	});

	var _POPOVER_ARROW_DIRECTION_LEFT = null;
	Object.defineProperty(this, 'POPOVER_ARROW_DIRECTION_LEFT', {
		get: function(){return _POPOVER_ARROW_DIRECTION_LEFT;},
		set: function(val){return _POPOVER_ARROW_DIRECTION_LEFT = val;}
	});

	var _POPOVER_ARROW_DIRECTION_RIGHT = null;
	Object.defineProperty(this, 'POPOVER_ARROW_DIRECTION_RIGHT', {
		get: function(){return _POPOVER_ARROW_DIRECTION_RIGHT;},
		set: function(val){return _POPOVER_ARROW_DIRECTION_RIGHT = val;}
	});

	var _POPOVER_ARROW_DIRECTION_UNKNOWN = null;
	Object.defineProperty(this, 'POPOVER_ARROW_DIRECTION_UNKNOWN', {
		get: function(){return _POPOVER_ARROW_DIRECTION_UNKNOWN;},
		set: function(val){return _POPOVER_ARROW_DIRECTION_UNKNOWN = val;}
	});

	var _POPOVER_ARROW_DIRECTION_UP = null;
	Object.defineProperty(this, 'POPOVER_ARROW_DIRECTION_UP', {
		get: function(){return _POPOVER_ARROW_DIRECTION_UP;},
		set: function(val){return _POPOVER_ARROW_DIRECTION_UP = val;}
	});

	// Methods
	this.createPopover = function(){
		console.debug('Method "Titanium.UI.iPad#.createPopover" is not implemented yet.');
	};
	this.createSplitWindow = function(){
		console.debug('Method "Titanium.UI.iPad#.createSplitWindow" is not implemented yet.');
	};

	Ti._5.presetUserDefinedElements(this, args);
});