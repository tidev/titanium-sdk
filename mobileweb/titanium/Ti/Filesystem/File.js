define(["Ti/_/declare", "Ti/_/Evented", "Ti/_/Filesystem/Local"],
	function(declare, Evented, localFS) {

	return declare("Ti/Filesystem/File", Evented, {

		constructor: function(args) {
			this._fs = require("Ti/Filesystem"); // need to require here to avoid circular dependency

			args = args || {};

			this._type = args.type || 'F';
		},

		constants: {
			executable: false,
			name: "",
			nativePath: "",
			parent: null, // Ti.File
			readonly: false,
			size: 0,
			symbolicLink: false,
			writable: true
		},

		properties: {
			hidden: false
		},

		append: function(data) {
			// data can be a String or Titanium.Blob or Titanium.Filesystem.File 	
			return true;
		},

		copy: function(dest) {
			return true;
		},

		createDirectory: function() {
			return true;
		},

		createTimestamp: function() {
			return 123;
		},

		deleteDirectory: function(recursive) {
			// recursive defaults to false
			if (this._type === 'D') {
				// TODO
				return true;
			}
			return false;
		},

		deleteFile: function() {
			if (this._type === 'F') {
				// TODO
				return true;
			}
			return false;
		},

		exists: function() {
			console.debug(this.nativePath);
			console.debug(this.name);
			return localFS.exists(this.nativePath + this.name);
		},

		extension: function() {
			return "";
		},

		getDirectoryListing: function() {
			return [];
		},

		isDirectory: function() {
			return this._type === 'D';
		},

		isFile: function() {
			return this._type === 'F';
		},

		modificationTimestamp: function() {
			return 123;
		},

		move: function(dest) {
			return true;
		},

		open: function(mode) {
			//return Titanium.Filesystem.FileStream;
		},

		read: function() {
			//return Titanium.Blob;
		},

		rename: function(newname) {
			return true;
		},

		spaceAvailable: function() {
			return 0;
		},

		write: function(data, append) {
			// data String or Titanium.Filesystem.File or Titanium.Blob
			// append false
			return true;
		},

		isFile: function() {
			return true;
		}

	});

});