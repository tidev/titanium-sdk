Ti._5.createClass('Titanium.UI.Android', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'android', args, 'Android');

	// Properties
	api.SWITCH_STYLE_CHECKBOX = 1;
	api.SWITCH_STYLE_TOGGLEBUTTON = 2;

	var _LINKIFY_ALL = null;
	Object.defineProperty(this, 'LINKIFY_ALL', {
		get: function(){return _LINKIFY_ALL;},
		set: function(val){return _LINKIFY_ALL = val;}
	});

	var _LINKIFY_EMAIL_ADDRESSES = null;
	Object.defineProperty(this, 'LINKIFY_EMAIL_ADDRESSES', {
		get: function(){return _LINKIFY_EMAIL_ADDRESSES;},
		set: function(val){return _LINKIFY_EMAIL_ADDRESSES = val;}
	});

	var _LINKIFY_MAP_ADDRESSES = null;
	Object.defineProperty(this, 'LINKIFY_MAP_ADDRESSES', {
		get: function(){return _LINKIFY_MAP_ADDRESSES;},
		set: function(val){return _LINKIFY_MAP_ADDRESSES = val;}
	});

	var _LINKIFY_MAP_LINKS = null;
	Object.defineProperty(this, 'LINKIFY_MAP_LINKS', {
		get: function(){return _LINKIFY_MAP_LINKS;},
		set: function(val){return _LINKIFY_MAP_LINKS = val;}
	});

	var _LINKIFY_PHONE_NUMBERS = null;
	Object.defineProperty(this, 'LINKIFY_PHONE_NUMBERS', {
		get: function(){return _LINKIFY_PHONE_NUMBERS;},
		set: function(val){return _LINKIFY_PHONE_NUMBERS = val;}
	});

	var _LINKIFY_WEB_URLS = null;
	Object.defineProperty(this, 'LINKIFY_WEB_URLS', {
		get: function(){return _LINKIFY_WEB_URLS;},
		set: function(val){return _LINKIFY_WEB_URLS = val;}
	});

	var _SOFT_INPUT_ADJUST_PAN = null;
	Object.defineProperty(this, 'SOFT_INPUT_ADJUST_PAN', {
		get: function(){return _SOFT_INPUT_ADJUST_PAN;},
		set: function(val){return _SOFT_INPUT_ADJUST_PAN = val;}
	});

	var _SOFT_INPUT_ADJUST_RESIZE = null;
	Object.defineProperty(this, 'SOFT_INPUT_ADJUST_RESIZE', {
		get: function(){return _SOFT_INPUT_ADJUST_RESIZE;},
		set: function(val){return _SOFT_INPUT_ADJUST_RESIZE = val;}
	});

	var _SOFT_INPUT_ADJUST_UNSPECIFIED = null;
	Object.defineProperty(this, 'SOFT_INPUT_ADJUST_UNSPECIFIED', {
		get: function(){return _SOFT_INPUT_ADJUST_UNSPECIFIED;},
		set: function(val){return _SOFT_INPUT_ADJUST_UNSPECIFIED = val;}
	});

	var _SOFT_INPUT_STATE_HIDDEN = null;
	Object.defineProperty(this, 'SOFT_INPUT_STATE_HIDDEN', {
		get: function(){return _SOFT_INPUT_STATE_HIDDEN;},
		set: function(val){return _SOFT_INPUT_STATE_HIDDEN = val;}
	});

	var _SOFT_INPUT_STATE_UNSPECIFIED = null;
	Object.defineProperty(this, 'SOFT_INPUT_STATE_UNSPECIFIED', {
		get: function(){return _SOFT_INPUT_STATE_UNSPECIFIED;},
		set: function(val){return _SOFT_INPUT_STATE_UNSPECIFIED = val;}
	});

	var _SOFT_INPUT_STATE_VISIBLE = null;
	Object.defineProperty(this, 'SOFT_INPUT_STATE_VISIBLE', {
		get: function(){return _SOFT_INPUT_STATE_VISIBLE;},
		set: function(val){return _SOFT_INPUT_STATE_VISIBLE = val;}
	});

	var _SOFT_KEYBOARD_DEFAULT_ON_FOCUS = null;
	Object.defineProperty(this, 'SOFT_KEYBOARD_DEFAULT_ON_FOCUS', {
		get: function(){return _SOFT_KEYBOARD_DEFAULT_ON_FOCUS;},
		set: function(val){return _SOFT_KEYBOARD_DEFAULT_ON_FOCUS = val;}
	});

	var _SOFT_KEYBOARD_HIDE_ON_FOCUS = null;
	Object.defineProperty(this, 'SOFT_KEYBOARD_HIDE_ON_FOCUS', {
		get: function(){return _SOFT_KEYBOARD_HIDE_ON_FOCUS;},
		set: function(val){return _SOFT_KEYBOARD_HIDE_ON_FOCUS = val;}
	});

	var _SOFT_KEYBOARD_SHOW_ON_FOCUS = null;
	Object.defineProperty(this, 'SOFT_KEYBOARD_SHOW_ON_FOCUS', {
		get: function(){return _SOFT_KEYBOARD_SHOW_ON_FOCUS;},
		set: function(val){return _SOFT_KEYBOARD_SHOW_ON_FOCUS = val;}
	});

	// Methods
	this.hideSoftKeyboard = function(){
		console.debug('Method "Titanium.UI.Android#.hideSoftKeyboard" is not implemented yet.');
	};
	this.openPreferences = function(){
		console.debug('Method "Titanium.UI.Android#.openPreferences" is not implemented yet.');
	};

	Ti._5.presetUserDefinedElements(this, args);
});