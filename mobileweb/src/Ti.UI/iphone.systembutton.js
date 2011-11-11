Ti._5.createClass('Titanium.UI.iPhone.SystemButton', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'iphone.systembutton', args, 'iPhone.SystemButton');

	// Properties
	var _ACTION = null;
	Object.defineProperty(this, 'ACTION', {
		get: function(){return _ACTION;},
		set: function(val){return _ACTION = val;}
	});

	var _ACTIVITY = null;
	Object.defineProperty(this, 'ACTIVITY', {
		get: function(){return _ACTIVITY;},
		set: function(val){return _ACTIVITY = val;}
	});

	var _ADD = null;
	Object.defineProperty(this, 'ADD', {
		get: function(){return _ADD;},
		set: function(val){return _ADD = val;}
	});

	var _BOOKMARKS = null;
	Object.defineProperty(this, 'BOOKMARKS', {
		get: function(){return _BOOKMARKS;},
		set: function(val){return _BOOKMARKS = val;}
	});

	var _CAMERA = null;
	Object.defineProperty(this, 'CAMERA', {
		get: function(){return _CAMERA;},
		set: function(val){return _CAMERA = val;}
	});

	var _CANCEL = null;
	Object.defineProperty(this, 'CANCEL', {
		get: function(){return _CANCEL;},
		set: function(val){return _CANCEL = val;}
	});

	var _COMPOSE = null;
	Object.defineProperty(this, 'COMPOSE', {
		get: function(){return _COMPOSE;},
		set: function(val){return _COMPOSE = val;}
	});

	var _CONTACT_ADD = null;
	Object.defineProperty(this, 'CONTACT_ADD', {
		get: function(){return _CONTACT_ADD;},
		set: function(val){return _CONTACT_ADD = val;}
	});

	var _DISCLOSURE = null;
	Object.defineProperty(this, 'DISCLOSURE', {
		get: function(){return _DISCLOSURE;},
		set: function(val){return _DISCLOSURE = val;}
	});

	var _DONE = null;
	Object.defineProperty(this, 'DONE', {
		get: function(){return _DONE;},
		set: function(val){return _DONE = val;}
	});

	var _EDIT = null;
	Object.defineProperty(this, 'EDIT', {
		get: function(){return _EDIT;},
		set: function(val){return _EDIT = val;}
	});

	var _FAST_FORWARD = null;
	Object.defineProperty(this, 'FAST_FORWARD', {
		get: function(){return _FAST_FORWARD;},
		set: function(val){return _FAST_FORWARD = val;}
	});

	var _FIXED_SPACE = null;
	Object.defineProperty(this, 'FIXED_SPACE', {
		get: function(){return _FIXED_SPACE;},
		set: function(val){return _FIXED_SPACE = val;}
	});

	var _FLEXIBLE_SPACE = null;
	Object.defineProperty(this, 'FLEXIBLE_SPACE', {
		get: function(){return _FLEXIBLE_SPACE;},
		set: function(val){return _FLEXIBLE_SPACE = val;}
	});

	var _INFO_DARK = null;
	Object.defineProperty(this, 'INFO_DARK', {
		get: function(){return _INFO_DARK;},
		set: function(val){return _INFO_DARK = val;}
	});

	var _INFO_LIGHT = null;
	Object.defineProperty(this, 'INFO_LIGHT', {
		get: function(){return _INFO_LIGHT;},
		set: function(val){return _INFO_LIGHT = val;}
	});

	var _ORGANIZE = null;
	Object.defineProperty(this, 'ORGANIZE', {
		get: function(){return _ORGANIZE;},
		set: function(val){return _ORGANIZE = val;}
	});

	var _PAUSE = null;
	Object.defineProperty(this, 'PAUSE', {
		get: function(){return _PAUSE;},
		set: function(val){return _PAUSE = val;}
	});

	var _PLAY = null;
	Object.defineProperty(this, 'PLAY', {
		get: function(){return _PLAY;},
		set: function(val){return _PLAY = val;}
	});

	var _REFRESH = null;
	Object.defineProperty(this, 'REFRESH', {
		get: function(){return _REFRESH;},
		set: function(val){return _REFRESH = val;}
	});

	var _REPLY = null;
	Object.defineProperty(this, 'REPLY', {
		get: function(){return _REPLY;},
		set: function(val){return _REPLY = val;}
	});

	var _REWIND = null;
	Object.defineProperty(this, 'REWIND', {
		get: function(){return _REWIND;},
		set: function(val){return _REWIND = val;}
	});

	var _SAVE = null;
	Object.defineProperty(this, 'SAVE', {
		get: function(){return _SAVE;},
		set: function(val){return _SAVE = val;}
	});

	var _SPINNER = null;
	Object.defineProperty(this, 'SPINNER', {
		get: function(){return _SPINNER;},
		set: function(val){return _SPINNER = val;}
	});

	var _STOP = null;
	Object.defineProperty(this, 'STOP', {
		get: function(){return _STOP;},
		set: function(val){return _STOP = val;}
	});

	var _TRASH = null;
	Object.defineProperty(this, 'TRASH', {
		get: function(){return _TRASH;},
		set: function(val){return _TRASH = val;}
	});


	Ti._5.presetUserDefinedElements(this, args);
});