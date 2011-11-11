Ti._5.createClass('Titanium.UI.iPhone.RowAnimationStyle', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'iphone.rowanimationstyle', args, 'iPhone.RowAnimationStyle');

	// Properties
	var _BOTTOM = null;
	Object.defineProperty(this, 'BOTTOM', {
		get: function(){return _BOTTOM;},
		set: function(val){return _BOTTOM = val;}
	});

	var _FADE = null;
	Object.defineProperty(this, 'FADE', {
		get: function(){return _FADE;},
		set: function(val){return _FADE = val;}
	});

	var _LEFT = null;
	Object.defineProperty(this, 'LEFT', {
		get: function(){return _LEFT;},
		set: function(val){return _LEFT = val;}
	});

	var _NONE = null;
	Object.defineProperty(this, 'NONE', {
		get: function(){return _NONE;},
		set: function(val){return _NONE = val;}
	});

	var _RIGHT = null;
	Object.defineProperty(this, 'RIGHT', {
		get: function(){return _RIGHT;},
		set: function(val){return _RIGHT = val;}
	});

	var _TOP = null;
	Object.defineProperty(this, 'TOP', {
		get: function(){return _TOP;},
		set: function(val){return _TOP = val;}
	});

	Ti._5.presetUserDefinedElements(this, args);
});