define("Ti/Filesystem", ["Ti/_/Evented"], function(Evented) {

	(function(api){
		// Interfaces
		Ti._5.EventDriven(api);
	
		// Properties
		Ti._5.propReadOnly(api, {
			MODE_APPEND: 1,
			MODE_READ: 2,
			MODE_WRITE: 3,
			applicationDataDirectory: "/",
			applicationDirectory: "/",
			lineEnding: "\n",
			resourcesDirectory: "/",
			separator: "/",
			tempDirectory: null
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
			return new Ti.Filesystem.File;
		};
		api.isExternalStoragePresent = function(){
			console.debug('Method "Titanium.Filesystem.isExternalStoragePresent" is not implemented yet.');
		};
	})(Ti._5.createClass('Ti.Filesystem'));

});