Ti._5.createClass('Titanium.UI.iPhone.StatusBar', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'iphone.statusbar', args, 'iPhone.StatusBar');

	// Properties
	var _DEFAULT = null;
	Object.defineProperty(this, 'DEFAULT', {
		get: function(){return _DEFAULT;},
		set: function(val){return _DEFAULT = val;}
	});

	var _GRAY = null;
	Object.defineProperty(this, 'GRAY', {
		get: function(){return _GRAY;},
		set: function(val){return _GRAY = val;}
	});

	var _OPAQUE_BLACK = null;
	Object.defineProperty(this, 'OPAQUE_BLACK', {
		get: function(){return _OPAQUE_BLACK;},
		set: function(val){return _OPAQUE_BLACK = val;}
	});

	var _TRANSLUCENT_BLACK = null;
	Object.defineProperty(this, 'TRANSLUCENT_BLACK', {
		get: function(){return _TRANSLUCENT_BLACK;},
		set: function(val){return _TRANSLUCENT_BLACK = val;}
	});

	Ti._5.presetUserDefinedElements(this, args);
});