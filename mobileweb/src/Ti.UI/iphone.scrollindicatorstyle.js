Ti._5.createClass('Titanium.UI.iPhone.ScrollIndicatorStyle', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'iphone.scrollindicatorstyle', args, 'iPhone.ScrollIndicatorStyle');

	// Properties
	var _BLACK = null;
	Object.defineProperty(this, 'BLACK', {
		get: function(){return _BLACK;},
		set: function(val){return _BLACK = val;}
	});

	var _DEFAULT = null;
	Object.defineProperty(this, 'DEFAULT', {
		get: function(){return _DEFAULT;},
		set: function(val){return _DEFAULT = val;}
	});

	var _WHITE = null;
	Object.defineProperty(this, 'WHITE', {
		get: function(){return _WHITE;},
		set: function(val){return _WHITE = val;}
	});

	Ti._5.presetUserDefinedElements(this, args);
});