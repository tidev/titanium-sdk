Ti._5.createClass('Titanium.UI.iPhone.AnimationStyle', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'iphone.animationstyle', args, 'iPhone.AnimationStyle');

	// Properties
	var _CURL_DOWN = null;
	Object.defineProperty(this, 'CURL_DOWN', {
		get: function(){return _CURL_DOWN;},
		set: function(val){return _CURL_DOWN = val;}
	});

	var _CURL_UP = null;
	Object.defineProperty(this, 'CURL_UP', {
		get: function(){return _CURL_UP;},
		set: function(val){return _CURL_UP = val;}
	});

	var _FLIP_FROM_LEFT = null;
	Object.defineProperty(this, 'FLIP_FROM_LEFT', {
		get: function(){return _FLIP_FROM_LEFT;},
		set: function(val){return _FLIP_FROM_LEFT = val;}
	});

	var _FLIP_FROM_RIGHT = null;
	Object.defineProperty(this, 'FLIP_FROM_RIGHT', {
		get: function(){return _FLIP_FROM_RIGHT;},
		set: function(val){return _FLIP_FROM_RIGHT = val;}
	});

	var _NONE = null;
	Object.defineProperty(this, 'NONE', {
		get: function(){return _NONE;},
		set: function(val){return _NONE = val;}
	});

	Ti._5.presetUserDefinedElements(this, args);
});