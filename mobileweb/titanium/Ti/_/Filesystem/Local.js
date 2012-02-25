define(["Ti/_/declare", "Ti/_/lang", "Ti/Blob", "Ti/Filesystem/FileStream", "./Base"],
	function(declare, lang, Blob, FileStream, Base) {

/*

KITCHEN SINK

var f = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory,'camera_photo.png');
f.write(image);

sampleImage = Ti.Filesystem.getFile('images/chat.png').read();

var f = Ti.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, 'cricket.wav');

var f = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'images', 'flower.jpg');
var blob = f.read();

var f = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, 'text.txt');
Ti.API.info('file = ' + f);
var contents = f.read();
Ti.API.info("contents blob object = "+contents);
Ti.API.info('contents = ' + contents.text);
Ti.API.info('mime type = ' + contents.mimeType);
Ti.API.info('Blob\'s file = ' + contents.file);
Ti.API.info('nativePath = ' + f.nativePath);
Ti.API.info('Blob\'s file nativePath= ' + contents.file.nativePath);
Ti.API.info('exists = ' + f.exists());
Ti.API.info('size = ' + f.size);
Ti.API.info('readonly = ' + f.readonly);
Ti.API.info('symbolicLink = ' + f.symbolicLink);
Ti.API.info('executable = ' + f.executable);
Ti.API.info('hidden = ' + f.hidden);
Ti.API.info('writable = ' + f.writable);
Ti.API.info('name = ' + f.name);
Ti.API.info('extension = ' + f.extension());
Ti.API.info('resolve = ' + f.resolve());
Ti.API.info('created = ' + String(new Date(f.createTimestamp()))); // #2085 test

var dir = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory);
Ti.API.info('directoryListing = ' + dir.getDirectoryListing());
Ti.API.info('getParent = ' + dir.getParent());
Ti.API.info('spaceAvailable = ' + dir.spaceAvailable());

var newDir = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory,'mydir');
Ti.API.info("Created mydir: " + newDir.createDirectory());
Ti.API.info('newdir ' + newDir);
var newFile = Titanium.Filesystem.getFile(newDir.nativePath,'newfile.txt');
newFile.write(f.read());
Ti.API.info('directoryListing for newDir = ' + newDir.getDirectoryListing());
Ti.API.info("newfile.txt created: " + String(new Date(newFile.createTimestamp())));
Ti.API.info("newfile.txt modified: " + String(new Date(newFile.modificationTimestamp())));
Ti.API.info("newfile.txt renamed as b.txt: " + newFile.rename('b.txt'));

var renamedFile = Titanium.Filesystem.getFile(newDir.nativePath, 'b.txt');
Ti.API.info("newfile.txt deleted (expected to fail): " + newFile.deleteFile());
Ti.API.info("b.txt deleted: " + renamedFile.deleteFile());
Ti.API.info("mydir deleted: " + newDir.deleteDirectory());
Ti.API.info('directoryListing for newDir after deleteDirectory = ' + newDir.getDirectoryListing());

var jsfile = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory,'app.js');
Ti.API.info("app.js exists? " + jsfile.exists());                                                                                                
Ti.API.info("app.js size? " + jsfile.size);

var testfile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'text.txt');
Ti.API.info('text.txt exists? ' + testfile.exists());
Ti.API.info('text.txt size: ' + testfile.size + ' bytes');

var f = Ti.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory,'images/apple_logo.jpg');

var plFile = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, 'paradise_lost.txt');
var text = plFile.read();

var f = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory,'examples','route.csv');
var csv = f.read();

bgImage = Titanium.Filesystem.getFile(f);
win.backgroundImage = bgImage.nativePath;

var filename = Titanium.Filesystem.applicationDataDirectory + "/" + new Date().getTime() + ".jpg";
if (bgImage != null) {
	bgImage.deleteFile();
}
bgImage = Titanium.Filesystem.getFile(filename);
bgImage.write(image);

var f = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory,'images/appcelerator_small.png');

var f1 = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, 'images', 'apple_logo.jpg');
var f2 = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory,'apple_logo.jpg');
f2.write(f1);

var f = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory,'ti.png');
f.write(this.responseData);
imageView.image = f.nativePath;

var plBlob = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, 'paradise_lost.txt').read();
var input = Ti.Stream.createStream({source:plBlob, mode:Ti.Stream.MODE_READ});

for (var index in connectedSockets) {
	var sock = connectedSockets[index];
	Ti.Stream.writeStream(input, sock, 4096);
}

BRAVO

var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, service + '.config');
if(!file.exists()) {
	Ti.API.error(service + '.config is missing');
	return false;
}

// try to read file
var contents = file.read();
if(contents == null) {
	Ti.API.error(service + '.config is empty');
	return false;
}

var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, service + '.config');
if(file == null) {
	file = Ti.Filesystem.createFile(Ti.Filesystem.applicationDataDirectory, service + '.config');
}
file.write(JSON.stringify({
	access_token : cfg.access_token,
	access_token_secret : cfg.access_token_secret
}));

var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, service + '.config');
file.deleteFile();

var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'cached_images', filename);
if (file.exists()) {
	// If it has been cached, assign the local asset path to the image view object.
	imageViewObject.set('image', file.nativePath);
} else {
	// If it hasn't been cached, grab the directory it will be stored in.
	var g = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'cached_images');
	if (!g.exists()) {
		// If the directory doesn't exist, make it
		g.createDirectory();
	}
	// ...
	file.write(xhr.responseData);
	imageViewObject.set('image', file.nativePath);
}

NBC

file = Ti.Filesystem.getFile(path, imageToCheck);
finalPath = (file.exists()) ? path + imageToCheck : path + image;

var termsContent = Ti.Filesystem.getFile(N._PATH._DOCS, 'terms.html');
Ti.UI.createWebView({ html:termsContent.read().text });

Ti.UI.createView({ backgroundImage:Titanium.Filesystem.applicationDataDirectory + object.siteId + '.jpg'});

file = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, button.data.siteId + '.jpg');
file.write(this.responseData);
*/

/*
stored meta info
	n	Filename
	p	Full path including filename (nativePath)
	d	Date created
	t	Type (D or F)
	c	Is copy

constants: {
	executable: false,
	name: "",
	nativePath: "",
	parent: null,
	readonly: false,
	size: 0,
	symbolicLink: false,
	writable: true
},

properties: {
	hidden: false
}
*/

	var extRegExp = /\.(.+)$/,
		File;

	function get(path) {
		return localStorage.getItem("ti:fs:" + path);
	}

	function set(obj) {
		localStorage.setItem("ti:fs:" + obj.path + obj.name, obj);
	}

	function fs() {
		return require("Ti/Filesystem");
	}

	function registry() {
		return require("/titanium/filesystem.registry");
	}

	return File = declare("Ti._.Filesystem.Local", Base, {

		constructor: function() {
			var p = this.nativePath;
			this._meta = p && get(p) || {};
		},

		append: function(/*Ti.Blob|Ti.Filesystem.File*/data) {
			// TODO:
			// - is data arg a valid blob?
			// - are we a file?
			// - load the data from localStorage
			// - if null, check the registry
			// - if exists in registry, xhr the file
			// - append data
			// - store file back into localstorage
			return true;
		},

		copy: function(dest) {
			dest = new File(dest)
			if (dest && this._type === 'F') {
				// TODO:
				// - rewrite the nativePath
				// - new ????
				var path = this.nativePath;
				set(path, {
					n: this.name,
					p: path
				});
				return true;
			}
			return false;
		},

		createDirectory: function() {
			return localFS.mkdir(this);
		},

		createFile: function() {
			return true;
		},

		createTimestamp: function() {
			var dateCreated = this._meta.dc;
			return dateCreated ? dateCreated.toString() : null;
		},

		deleteDirectory: function(recursive) {
			return this.isDirectory() && localFS.rmdir(this);
		},

		deleteFile: function() {
			return this.isFile() && localFS.rm(this);
		},

		exists: function() {
			return localFS.exists(this);
		},

		extension: function() {
			var m = this.name.match(extRegExp);
			return m ? m[1] : "";
		},

		getDirectoryListing: function() {
			if (this.isDirectory()) {
				
			}
			return null;
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
			return localFS.mv(this, dest);
		},

		open: function(mode) {
			if (mode) {
				this.mode = mode;
				// MODE_READ, MODE_WRITE, or MODE_APPEND.
				//return Titanium.Filesystem.FileStream;
			}
			return null;
		},

		read: function() {
			/*
			data
			height: 0, // images only
			length: 0,
			mimeType: "",
			nativePath: "",
			size: 0, // images only
			text: null, // null if binary, else string
			width: 0 // images only
			*/
			//return Blob;
		},

		rename: function(newname) {
			this.name = newname;
			// TODO:
			// - update the nativePath
			// - save meta
			// - if a directory, find ALL files in this directory and rename
			return true;
		},

		spaceAvailable: function() {
			return 0;
		},

		write: function(data, append) {
			// data String or Titanium.Filesystem.File or Titanium.Blob
			// append false
			return true;
		}

	});

/*
	var is = require.is,
		ls = window.localStorage,
		storage = {};

	if (!require.has("native-localstorage")) {
		// simple memory only storage shim
		ls = {
			getItem: function(key) {
				return storage[key] || null;
			},
			setItem: function(key, value) {
				storage[key] = JSON.stringify(value);
			},
			removeItem: function(key) {
				delete storage[key];
			}
		}
	}

	

	

	return lang.setObject("Ti._.Filesystem.Local", {

		exists: function(path) {
			return !!get(is(path, "Object") ? path : parse(path));
		},

		mkdir: function(path) {
console.debug("mkdir(" + path + ")");
			var resource = is(path, "Object") ? path : parse(path),
				parts = [],
				dirs = resource.path,
				result;
			dirs.length || dirs.push("");
			dirs.forEach(function(part) {
				parts.push(part);
				result = get(resource.bucket, parts.join('/'));
				if (!result || !result.type == 'D') {
console.debug("creating directory \"" + part + "\" in \"" + parts.join('/') + "\"");
					set(result = {
						name: part,
						path: parts.join('/'),
						bucket: resource.bucket,
						type: 'D',
						listing: []
					});
				}
			});
			// THIS MUST RETURN A Ti.Filesystem.File OBJECT
			return result;
		},

		touch: function(path) {
console.debug("touch(" + path + ")");
			var resource = parse(path),
				file = get(resource),
				filename = resource.path.pop(),
				dir = this.mkdir(resource),
				result;
			if (!file || !file.type == 'F') {
console.debug("creating file \"" + file + "\" in \"" + dir.path + "\"");
				set(result = {
					name: filename,
					path: dir.path,
					bucket: path.bucket,
					type: 'F',
					size: 0
				});
			}
			// THIS MUST RETURN A Ti.Filesystem.File OBJECT
			return result;
		}

	});
*/
});