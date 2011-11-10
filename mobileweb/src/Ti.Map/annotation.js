(function(api){
	// Interfaces
	Ti._5.EventDriven(api);

	// Properties
	var _animate = null;
	Object.defineProperty(api, 'animate', {
		get: function(){return _animate;},
		set: function(val){return _animate = val;}
	});

	var _image = null;
	Object.defineProperty(api, 'image', {
		get: function(){return _image;},
		set: function(val){return _image = val;}
	});

	var _leftButton = null;
	Object.defineProperty(api, 'leftButton', {
		get: function(){return _leftButton;},
		set: function(val){return _leftButton = val;}
	});

	var _leftView = null;
	Object.defineProperty(api, 'leftView', {
		get: function(){return _leftView;},
		set: function(val){return _leftView = val;}
	});

	var _pincolor = null;
	Object.defineProperty(api, 'pincolor', {
		get: function(){return _pincolor;},
		set: function(val){return _pincolor = val;}
	});

	var _rightButton = null;
	Object.defineProperty(api, 'rightButton', {
		get: function(){return _rightButton;},
		set: function(val){return _rightButton = val;}
	});

	var _rightView = null;
	Object.defineProperty(api, 'rightView', {
		get: function(){return _rightView;},
		set: function(val){return _rightView = val;}
	});

	var _subtitle = null;
	Object.defineProperty(api, 'subtitle', {
		get: function(){return _subtitle;},
		set: function(val){return _subtitle = val;}
	});

	var _subtitleid = null;
	Object.defineProperty(api, 'subtitleid', {
		get: function(){return _subtitleid;},
		set: function(val){return _subtitleid = val;}
	});

	var _title = null;
	Object.defineProperty(api, 'title', {
		get: function(){return _title;},
		set: function(val){return _title = val;}
	});

	var _titleid = null;
	Object.defineProperty(api, 'titleid', {
		get: function(){return _titleid;},
		set: function(val){return _titleid = val;}
	});

})(Ti._5.createClass('Titanium.Map.Annotation'));