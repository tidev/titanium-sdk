define(["Ti/_/declare", "Ti/_/lang", "Ti/Blob", "Ti/Filesystem/FileStream"],
	function(declare, lang, Blob, FileStream) {

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

	var reg,
		regDate = (new Date()).getTime(),
		File,
		metaMap = {
			n: "sname",
			c: "i_created",
			m: "i_modified",
			t: "s_type",
			e: "b_remote",
			x: "bexecutable",
			r: "breadonly",
			s: "isize",
			l: "bsymbolicLink", // should this be a string?
			h: "bhidden"
			// do we need a "is copy" flag?
		},
		metaCast = {
			i: function(i) {
				return i - 0;
			},
			s: function(s) {
				return ""+s;
			},
			b: function(b) {
				return !!b;
			}
		},
		pathRegExp = /(\/)?([^\:]*)(\:\/\/)?(.*)/,
		mimeTypes = "application/octet-stream,text/plain,text/html,text/css,text/xml,text/mathml,image/gif,image/jpeg,image/png,image/x-icon,image/svg+xml,application/x-javascript,application/json,application/pdf,application/x-opentype,audio/mpeg,video/mpeg,video/quicktime,video/x-flv,video/x-ms-wmv,video/x-msvideo,video/ogg,video/mp4,video/webm".split(','),
		mimeExtentions = {
			txt: 1,
			html: 2,
			htm: 2,
			css: 3,
			xml: 4,
			mml: 5,
			gif: 6,
			jpeg: 7,
			jpg: 7,
			png: 8,
			ico: 9,
			svg: 10,
			js: 11,
			json: 12,
			pdf: 13,
			otf: 14,
			mp3: 15,
			mpeg: 16,
			mpg: 16,
			mov: 17,
			flv: 18,
			wmv: 19,
			avi: 20,
			ogg: 21,
			ogv: 21,
			mp4: 22,
			m4v: 22,
			webm: 23
		};

	function getLocal(path, meta) {
		return localStorage.getItem("ti:fs:" + (meta ? "meta:" : "data:") + path);
	}

	function getRemote(path) {
		var xhr = new XMLHttpRequest,
			type;

		xhr.overrideMimeType('text/plain; charset=x-user-defined')
		xhr.open("GET", path, false);
		xhr.send(null);
		type = xhr.getResponseHeader("Content-Type");

		return xhr.status === 200 ? { data: xhr.responseText, mimeType: type } : null;
	}

	function registry(path) {
		var stack = [],
			r;

		if (!reg) {
			reg = {
				'/': "tD\nr1"
			};

			require("/titanium/filesystem.registry").split(/\n|\|/).forEach(function(line, i) {
				var depth = 0,
					line = line.split('\t'),
					len = line.length,
					name;

				if (i === 0 && line[0] === "ts") {
					regDate = line[1];
					reg['/'] += "\nc" + regDate;
				} else {
					for (; depth < len && !line[depth]; depth++) {}
					stack = stack.slice(0, depth).concat(name = line[depth]);
					reg['/' + stack.join('/')] = "n" + name + "\nt" + (depth + 1 == len ? 'D' : 'F\ns' + line[depth + 1]);
				}
			});
		}
		return (r = reg[path]) && r + "\nr1\ne1\nc" + regDate + "\nm" + regDate;
	}

	return File = declare("Ti._.Filesystem.Local", null, {

		constructor: function(path) {
			if (require.is(path, "String")) {
				var match = path.match(pathRegExp),
					b = !match[1] && match[3];

				if (/^\.\./.test(path = b ? match[4] : match[2])) {
					throw new Error('Irrational path "' + path + '"');
				}

				this.constants.__values__.nativePath = (b ? match[2] + "://" : "/") + path;
			}

			this._type = 'F';
		},

		postscript: function(args) {
			var c = this.constants.__values__,
				path = this.nativePath,
				metaData = path && getLocal(path, 1) || registry(path),
				match = path.match(pathRegExp);

			metaData && (this._exists = 1) && metaData.split('\n').forEach(function(line) {
				var fieldInfo = metaMap[line.charAt(0)],
					field = fieldInfo.substring(1),
					value = metaCast[fieldInfo.charAt(0)](line.substring(1));
				(c.hasOwnProperty(field) ? c : this)[field] = value;
			}, this);

			c.name = path.split('/').pop();

			match && match[1] || (c.readonly = true); // resources folder is readonly
		},

		constants: {
			name: "",
			executable: false,
			readonly: false,
			size: 0,
			symbolicLink: false,
			hidden: false,
			nativePath: "",
			parent: function() {
				// TODO: if we're not already at the root level, pop the current nativePath and return a new File()
				return null;
			},
			writable: {
				get: function() {
					return !this.readonly;
				},
				set: function(value) {
					return this.constants.__value__.readonly = !value;
				},
				value: true
			}
		},

		properties: {
			hidden: {
				get: function() {
					return this._meta.hidden;
				},
				set: function(value) {
					this._meta.hidden = value;
				}
			}
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
			if (!this.exists()) {
				// TODO
				return true;
			}
			return false;
		},

		createFile: function() {
			if (!this.exists()) {
				// TODO
				return true;
			}
			return false;
		},

		createTimestamp: function() {
			var d = this._created;
			return d ? d.toString() : null;
		},

		deleteDirectory: function(recursive) {
			if (this.isDirectory()) {
				// TODO
				return true;
			}
			return false;
		},

		deleteFile: function() {
			if (this.isFile()) {
				// TODO
				return true;
			}
			return false;
		},

		exists: function() {
			return !!this._exists;
		},

		extension: function() {
			var m = this.name.match(/\.(.+)$/);
			return m ? m[1] : "";
		},

		getDirectoryListing: function() {
			if (this.isDirectory()) {
				var files = [];
				// TODO
				return files;
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
			var d = this._modified;
			return d ? d.toString() : null;
		},

		move: function(dest) {
			if (this.exists()) {
				// TODO
				// - check if dest already exists
				return true;
			}
			return false;
		},

		open: function(mode) {
			if (mode) {
				this._openMode = mode;
				// MODE_READ, MODE_WRITE, or MODE_APPEND.
				//return Titanium.Filesystem.FileStream;
			}
			return null;
		},

		read: function() {
			if (this.exists() && this.isFile()) {
				var path = this.nativePath,
					params,
					obj,
					data = this._remote ? (obj = getRemote(path)).data : getLocal(path),
					type = obj && obj.mimeType || mimeTypes[mimeExtentions[this.extension] || 0],
					binaryData,
					i,
					len = data.length;

				if (data) {
					params = {
						data: data,
						length: len,
						mimeType: type,
						nativePath: path
					};
					if (/^(application|image|audio|video)\//.test(type)) {
						var binaryData = "";
						for (i = 0; i < len; i++) {
							binaryData += String.fromCharCode(data.charCodeAt(i) & 0xff);
						}
						params.size = len;
						try {
							// TODO: shim btoa
							params.data = window.btoa(binaryData);
							if (!type.indexOf("image/")) {
								i = new Image;
								i.src = "data:" + type + ";base64," + params.data;
								params.width = i.width;
								params.height = i.height;
							}
						} catch (ex) {}
					}
					return new Blob(params);
				}
			}
			return null;
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
	function fs() {
		return require("Ti/Filesystem");
	}


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