define(["Ti/_/Evented", "Ti/_/lang"],
	function(Evented, lang) {

	var external = require.config.filesystem.external;
	// need to validate/authenticate external storage

	return lang.setObject("Ti.Filesystem", Evented, {

		constants: {
			MODE_APPEND: 4,
			MODE_READ: 1,
			MODE_WRITE: 2,

			applicationDataDirectory: "/",
			lineEnding: "\n",
			resourcesDirectory: "/",
			separator: "/",
			tempDirectory: "/tmp"
		},

		createFile: function(args){
			var m = require("Ti/Filesystem/File");
			return new m(args);
		},

		createTempDirectory: function(args) {
			//
		},

		createTempFile: function(args) {
			//
		},

		getExternalStorageDirectory: function() {
			//
		},

		getFile: function(args) {
			//
		},

		isExternalStoragePresent: function(args) {
			return false;
		}

	});

});