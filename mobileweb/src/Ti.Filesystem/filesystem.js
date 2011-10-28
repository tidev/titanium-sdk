(function(api){
	// Interfaces
	Ti._5.EventDriven(api);

	// Properties
	var _MODE_APPEND = null;
	Object.defineProperty(api, 'MODE_APPEND', {
		get: function(){return _MODE_APPEND;},
		set: function(val){return _MODE_APPEND = val;}
	});

	var _MODE_READ = null;
	Object.defineProperty(api, 'MODE_READ', {
		get: function(){return _MODE_READ;},
		set: function(val){return _MODE_READ = val;}
	});

	var _MODE_WRITE = null;
	Object.defineProperty(api, 'MODE_WRITE', {
		get: function(){return _MODE_WRITE;},
		set: function(val){return _MODE_WRITE = val;}
	});

	var _applicationDataDirectory = null;
	Object.defineProperty(api, 'applicationDataDirectory', {
		get: function(){return _applicationDataDirectory;},
		set: function(val){return _applicationDataDirectory = val;}
	});

	var _applicationDirectory = null;
	Object.defineProperty(api, 'applicationDirectory', {
		get: function(){return _applicationDirectory;},
		set: function(val){return _applicationDirectory = val;}
	});

	var _lineEnding = null;
	Object.defineProperty(api, 'lineEnding', {
		get: function(){return _lineEnding;},
		set: function(val){return _lineEnding = val;}
	});

	var _resourcesDirectory = null;
	Object.defineProperty(api, 'resourcesDirectory', {
		get: function(){return _resourcesDirectory;},
		set: function(val){return _resourcesDirectory = val;}
	});

	var _separator = null;
	Object.defineProperty(api, 'separator', {
		get: function(){return _separator;},
		set: function(val){return _separator = val;}
	});

	var _tempDirectory = null;
	Object.defineProperty(api, 'tempDirectory', {
		get: function(){return _tempDirectory;},
		set: function(val){return _tempDirectory = val;}
	});

	// Methods
	api.createFile = function(){
		console.debug('Method "Titanium.Filesystem.createFile" is not implemented yet.');
	};
	api.createTempDirectory = function(){
		console.debug('Method "Titanium.Filesystem.createTempDirectory" is not implemented yet.');
	};
	api.createTempFile = function(){
		console.debug('Method "Titanium.Filesystem.createTempFile" is not implemented yet.');
	};
	api.getFile = function(){
		console.debug('Method "Titanium.Filesystem.getFile" is not implemented yet.');
	};
	api.isExternalStoragePresent = function(){
		console.debug('Method "Titanium.Filesystem.isExternalStoragePresent" is not implemented yet.');
	};
})(Ti._5.createClass('Titanium.Filesystem'));