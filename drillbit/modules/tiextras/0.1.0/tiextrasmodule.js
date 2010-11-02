/**
 * Appcelerator Drillbit
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 * 
 * Extras for Titanium Desktop
 * Provides alias shortcuts, some new / simplified helper APIs, and helper functions for various builtin types
 */
(function() {
	ti = Ti = Titanium;
	ti.fs = Ti.FS = Ti.Filesystem;
	ti.proc = Ti.Proc = Ti.Process;
	ti.api = Ti.API;
	ti.app = Ti.App;
	
	Ti.Path = {
		pathsep: ti.platform == "win32" ? ";" : ":",
		
		join: function() {
			if (arguments.length == 0) return null;
			return ti.fs.getFile(Array.prototype.slice.call(arguments)).nativePath();
		},
		
		split: function(path) {
			return path.split(ti.fs.separator);
		},
		
		dirname: function(path) {
			return ti.fs.getFile(path).parent().nativePath();
		},

		basename: function(path) {
			return ti.fs.getFile(path).name();
		},
		
		relpath: function(path, start) {
			return path.substring(start.length+1);
		},
		
		ext: function(path) {
			return ti.fs.getFile(path).extension();
		},
		
		exists: function(path) {
			return ti.fs.getFile(path).exists();
		},
		
		listdir: function(path) {
			return ti.fs.getFile(path).getDirectoryListing();
		},
		
		isfile: function(path) {
			return ti.fs.getFile(path).isFile();
		},
		
		isdir: function(path) {
			return ti.fs.getFile(path).isDirectory();
		},
		
		copy: function(from, to) {
			ti.fs.getFile(from).copy(ti.fs.getFile(to));
		},
		
		fromurl: function(url) {
			return ti.app.appURLToPath(url);
		},
		
		recurse: function(path, fn) {
			var self = this;
			this.listdir(path).forEach(function(file) {
				if (file.isDirectory()) {
					self.recurse(file.nativePath(), fn);
				}
				else if (file.isFile()) {
					fn(file);
				}
			});
		}
	};
	ti.path = Ti.Path;
	
	Ti.include = function() {
		args = Array.prototype.slice.call(arguments);
		var results = [];
		for (var i = 0; i < args.length; i++) {
			var arg = args[i];
			var file = ti.fs.getFile(arg);
			var stream = file.open();
			var code = stream.read();
			stream.close();
			try {
				ti.api.debug("including: " + file.nativePath());
				results.push(eval(code.toString()));
			} catch (e) {
				Ti.API.error("Error: "+String(e)+", "+file.nativePath()+", line:"+e.line);
				throw e;
			}
		}
		if (results.length == 1) {
			return results[0];
		}
		return results;
	};
	
	Ti.API.findModule = function(name, version) {
		var modules = Ti.API.getApplication().getModules();
		var cmpVersion = typeof(version) == 'undefined';
		
		for (var i = 0; i < modules.length; i++) {
			var module = modules[i];
			if (module.getName() == name) {
				if (!cmpVersion || module.getVersion() == version) {
					return module;
				}
			}
		}
		return null;
	};
	
	Ti.Platform.isOSX = function() {
		return Ti.platform == "osx";
	};

	Ti.Platform.isWin32 = function() {
		return Ti.platform == "win32";
	};
	
	Ti.Platform.isLinux = function() {
		return Ti.platform == "linux";
	};
	
	Array.prototype.contains = function(value) {
		return this.indexOf(value) > -1;
	};
	
	Array.prototype.pushUnique = function(value) {
		if (!this.contains(value)) {
			this.push(value);
		}
	};
})();