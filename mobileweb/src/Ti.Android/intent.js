(function(api){
	// Properties
	var _action = null;
	Object.defineProperty(api, 'action', {
		get: function(){return _action;},
		set: function(val){return _action = val;}
	});

	var _className = null;
	Object.defineProperty(api, 'className', {
		get: function(){return _className;},
		set: function(val){return _className = val;}
	});

	var _data = null;
	Object.defineProperty(api, 'data', {
		get: function(){return _data;},
		set: function(val){return _data = val;}
	});

	var _flags = null;
	Object.defineProperty(api, 'flags', {
		get: function(){return _flags;},
		set: function(val){return _flags = val;}
	});

	var _packageName = null;
	Object.defineProperty(api, 'packageName', {
		get: function(){return _packageName;},
		set: function(val){return _packageName = val;}
	});

	var _type = null;
	Object.defineProperty(api, 'type', {
		get: function(){return _type;},
		set: function(val){return _type = val;}
	});

	var _url = null;
	Object.defineProperty(api, 'url', {
		get: function(){return _url;},
		set: function(val){return _url = val;}
	});

	// Methods
	api.addCategory = function(){
		console.debug('Method "Titanium.Android.Intent.addCategory" is not implemented yet.');
	};
	api.addFlags = function(){
		console.debug('Method "Titanium.Android.Intent.addFlags" is not implemented yet.');
	};
	api.getBooleanExtra = function(){
		console.debug('Method "Titanium.Android.Intent.getBooleanExtra" is not implemented yet.');
	};
	api.getData = function(){
		console.debug('Method "Titanium.Android.Intent.getData" is not implemented yet.');
	};
	api.getDoubleExtra = function(){
		console.debug('Method "Titanium.Android.Intent.getDoubleExtra" is not implemented yet.');
	};
	api.getIntExtra = function(){
		console.debug('Method "Titanium.Android.Intent.getIntExtra" is not implemented yet.');
	};
	api.getLongExtra = function(){
		console.debug('Method "Titanium.Android.Intent.getLongExtra" is not implemented yet.');
	};
	api.getStringExtra = function(){
		console.debug('Method "Titanium.Android.Intent.getStringExtra" is not implemented yet.');
	};
	api.hasExtra = function(){
		console.debug('Method "Titanium.Android.Intent.hasExtra" is not implemented yet.');
	};
	api.putExtra = function(){
		console.debug('Method "Titanium.Android.Intent.putExtra" is not implemented yet.');
	};
	api.putExtraUri = function(){
		console.debug('Method "Titanium.Android.Intent.putExtraUri" is not implemented yet.');
	};
})(Ti._5.createClass('Titanium.Android.Intent'));