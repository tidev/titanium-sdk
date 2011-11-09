(function(api){
	// Properties
	var _anim = null;
	Object.defineProperty(api, 'anim', {
		get: function(){return _anim;},
		set: function(val){return _anim = val;}
	});

	var _array = null;
	Object.defineProperty(api, 'array', {
		get: function(){return _array;},
		set: function(val){return _array = val;}
	});

	var _attr = null;
	Object.defineProperty(api, 'attr', {
		get: function(){return _attr;},
		set: function(val){return _attr = val;}
	});

	var _color = null;
	Object.defineProperty(api, 'color', {
		get: function(){return _color;},
		set: function(val){return _color = val;}
	});

	var _dimen = null;
	Object.defineProperty(api, 'dimen', {
		get: function(){return _dimen;},
		set: function(val){return _dimen = val;}
	});

	var _drawable = null;
	Object.defineProperty(api, 'drawable', {
		get: function(){return _drawable;},
		set: function(val){return _drawable = val;}
	});

	var _id = null;
	Object.defineProperty(api, 'id', {
		get: function(){return _id;},
		set: function(val){return _id = val;}
	});

	var _integer = null;
	Object.defineProperty(api, 'integer', {
		get: function(){return _integer;},
		set: function(val){return _integer = val;}
	});

	var _layout = null;
	Object.defineProperty(api, 'layout', {
		get: function(){return _layout;},
		set: function(val){return _layout = val;}
	});

	var _string = null;
	Object.defineProperty(api, 'string', {
		get: function(){return _string;},
		set: function(val){return _string = val;}
	});

	var _style = null;
	Object.defineProperty(api, 'style', {
		get: function(){return _style;},
		set: function(val){return _style = val;}
	});

	var _styleable = null;
	Object.defineProperty(api, 'styleable', {
		get: function(){return _styleable;},
		set: function(val){return _styleable = val;}
	});

})(Ti._5.createClass('Titanium.Android.R'));