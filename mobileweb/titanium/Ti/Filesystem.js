define(["Ti/_/Evented", "Ti/_/lang"], function(Evented, lang) {

	lang.setObject("Ti.Filesystem", Evented, {

		constants: {
			MODE_APPEND: 1,
			MODE_READ: 2,
			MODE_WRITE: 3,
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

		getFile: function(args) {
			//
		},

		isExternalStoragePresent: function(args) {
			return false;
		}

	});

});