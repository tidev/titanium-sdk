define(["Ti/_", "Ti/_/declare", "Ti/_/encoding", "Ti/_/lang", "Ti/API", "Ti/Blob"],
	function(_, declare, encoding, lang, API, Blob) {

	var reg,
		regDate = Date.now(),
		File,
		Filesystem,
		is = require.is,
		ls = localStorage,
		slash = '/',
		metaMap = {
			n: "sname",
			c: "i_created",
			m: "i_modified",
			t: "s_type",
			y: "s_mimeType",
			e: "b_remote",
			x: "bexecutable",
			r: "breadonly",
			s: "isize",
			l: "bsymbolicLink",
			h: "bhidden"
		},
		metaCast = {
			i: function(i) {
				return i - 0;
			},
			s: function(s) {
				return ""+s;
			},
			b: function(b) {
				return !!(b|0);
			}
		},
		metaPrefix = "ti:fs:meta:",
		blobPrefix = "ti:fs:blob:",
		pathRegExp = /(\/)?([^\:]*)(\:\/\/)?(.*)/,

		// important! add new mime types to the end of array and then figure out the index to assign to each extension
		mimeTypes = "application/octet-stream,text/plain,text/html,text/css,text/xml,text/mathml,image/gif,image/jpeg,image/png,image/x-icon,image/svg+xml,application/x-javascript,application/json,application/pdf,application/x-opentype,audio/mpeg,video/mpeg,video/quicktime,video/x-flv,video/x-ms-wmv,video/x-msvideo,video/ogg,video/mp4,video/webm,text/csv".split(','),
		mimeExtentions = { txt: 1, html: 2, htm: 2, css: 3, xml: 4, mml: 5, gif: 6, jpeg: 7, jpg: 7, png: 8, ico: 9, svg: 10, js: 11, json: 12, pdf: 13, otf: 14, mp3: 15, mpeg: 16, mpg: 16, mov: 17, flv: 18, wmv: 19, avi: 20, ogg: 21, ogv: 21, mp4: 22, m4v: 22, webm: 23, csv: 24 };

	function getLocal(path, meta) {
		return ls.getItem("ti:fs:" + (meta ? "meta:" : "blob:") + path);
	}

	function setLocal(path, value, meta) {
		ls.setItem("ti:fs:" + (meta ? "meta:" : "blob:") + path, value);
		return value.length;
	}

	function getRemote(path) {
		var xhr = new XMLHttpRequest;
		xhr.overrideMimeType('text/plain; charset=x-user-defined');
		xhr.open("GET", '.' + path, false);
		xhr.send(null);
		return xhr.status === 200 ? { data: xhr.responseText, mimeType: xhr.getResponseHeader("Content-Type") } : null;
	}

	function registry(path) {
		var stack = [],
			r;

		if (!reg) {
			reg = {
				'/': "tD\nr1"
			};

			require("./titanium/filesystem.registry").split(/\n|\|/).forEach(function(line, i) {
				var depth = 0,
					line = line.split('\t'),
					len = line.length,
					name;

				if (i === 0 && line[0] === "ts") {
					regDate = line[1];
					reg[slash] += "\nc" + regDate;
				} else {
					for (; depth < len && !line[depth]; depth++) {}
					stack = stack.slice(0, depth).concat(name = line[depth]);
					reg[slash + stack.join(slash)] = "n" + name + "\nt" + (depth + 1 == len ? 'D' : 'F\ns' + line[depth + 1]);
				}
			});
		}
		return (r = reg[path]) && r + "\nr1\ne1\nc" + regDate + "\nm" + regDate;
	}

	function filesystem() {
		return Filesystem || (Filesystem = require("Ti/Filesystem"));
	}

	function mkdir(prefix, parts, i, parent) {
		var file,
			i = i || 1,
			path = prefix + parts.slice(0, i).join(slash);

		if (parent && parent.readonly) {
			// parent directory is readonly, so we can't create a directory here
			API.error('Unable to create "' + path + '" because parent is readonly');
			return false;
		}

		file = new File({
			nativePath: path,
			type: 'D'
		});
		file.createDirectory();

		if (++i > parts.length) {
			// we're done!
			return true;
		}

		return mkdir(prefix, parts, i, file);
	}

	function mkdirs(path) {
		if (path) {
			var match = path.match(pathRegExp),
				prefix = (match[1] ? match[1] : match[2] + match[3]) || slash;
			path = match[1] ? match[2] : match[4];
			return path ? mkdir(prefix, path.split(slash)) : true;
		}
		return false;
	}

	function cpdir(src, dest) {
		var path = src.nativePath,
			re = new RegExp("^(ti:fs:meta|ti:fs:blob):" + path + (/\/$/.test(path) ? '' : slash) + "(.*)"),
			match,
			key,
			i = 0,
			len = ls.length;

		dest = filesystem().getFile(dest.nativePath, src.name);

		if (mkdirs(dest.nativePath)) {
			while (i < len) {
				key = ls.key(i++);
				(match = key.match(re)) && ls.setItem(match[1] + ':' + dest.nativePath + slash + match[2], ls.getItem(key) || '');
			}
			return true;
		}

		return false;
	}

	function purgeTemp() {
		var re = /^ti:fs:tmp:\/\//,
			i = 0,
			len = ls.length,
			key;
		while (i < len) {
			key = ls.key(i++);
			re.test(key) && ls.removeItem(key);
		}
	}
	purgeTemp();
	require.on(window, "beforeunload", purgeTemp);

	(function(paths, now) {
		for (var p in paths) {
			getLocal(p, 1) || setLocal(p, "c" + now + "\nm" + now + "\ntD\ne0\nx0\nl0\nh0\nr" + paths[p], 1);
		}
	}({
		"appdata://": 0,
		"/": 1,
		"tmp://": 0
	}, Date.now()));

	return File = declare("Ti._.Filesystem.Local", null, {

		constructor: function(path) {
			if (is(path, "String")) {
				var match = path.match(pathRegExp),
					b = !match[1] && match[3];

				if (/^\.\./.test(path = b ? match[4] : match[2])) {
					throw new Error('Irrational path "' + path + '"');
				}

				this.constants.__values__.nativePath = (b ? match[2] + "://" : slash) + path;
			}

			this._type = !path || path._type === 'D' ? 'D' : 'F';
		},

		postscript: function(args) {
			var c = this.constants,
				path = this.nativePath,
				metaData = path && getLocal(path, 1) || registry(path),
				match = path.match(pathRegExp),
				prefix = (match[1] ? match[1] : match[2] + match[3]) || slash,
				parentPath,
				parent;

			metaData && (this._exists = 1) && metaData.split('\n').forEach(function(line) {
				var fieldInfo = metaMap[line.charAt(0)],
					field = fieldInfo.substring(1),
					value = metaCast[fieldInfo.charAt(0)](line.substring(1));
				(c.hasOwnProperty(field) ? c.__values__ : this)[field] = value;
			}, this);

			path = match[1] ? match[2] : match[4];
			parentPath = path.split(slash);
			c.name = parentPath.pop();
			parentPath = parentPath.join(slash);
			parent = c.parent = path ? new File(prefix + parentPath) : null;

			(parent && parent.readonly) || (match && match[1]) && (c.readonly = true);
		},

		constants: {
			name: "",
			executable: false,
			readonly: false,
			size: 0,
			symbolicLink: false,
			nativePath: "",
			parent: null,
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
			hidden: false
		},

		append: function(/*Ti.Blob|Ti.Filesystem.File*/data) {
			if (this.isFile()) {
				switch (data && data.declaredClass) {
					case "Ti.Filesystem.File":
						data = data.read();
					case "Ti.Blob":
						this._mimeType = data.mimeType;
						data = data.text;
				}
				var blob = this.read();
				blob.append(data);
				return this.write(blob);
			}
			return false;
		},

		copy: function(dest) {
			if (this.exists && dest) {
				var fs = filesystem(),
					dest = dest.declaredClass === "Ti.Filesystem.File" ? dest : fs.getFile.apply(null, arguments),
					p = dest.parent,
					isFile = this.isFile();
				if (dest.exists()) {
					if (dest.readonly) {
						return false;
					}
					if (dest.isFile()) {
						if (!isFile) {
							Ti.API.error("Destination is not a directory");
							return false;
						}
						return dest.write(this.read());
					} else {
						return isFile ? fs.getFile(dest.nativePath, this.name).write(this.read()) : cpdir(this, dest);
					}
				} else {
					if (p) {
						p.createDirectory();
						if (!p.exists() || p.readonly || (!isFile && !dest.createDirectory())) {
							return false;
						}
					}
					return isFile ? dest.write(this.read()) : cpdir(this, dest);
				}
			}
			return false;
		},

		createDirectory: function() {
			return this._create('D');
		},

		createFile: function() {
			return this._create('F');
		},

		createTimestamp: function() {
			return this._created || null;
		},

		deleteDirectory: function(recursive) {
			if (this.isDirectory() && !this.readonly) {
				var path = this.nativePath,
					re = new RegExp("^ti:fs:(meta|blob):" + path + (/\/$/.test(path) ? '' : slash) + ".*"),
					i = 0,
					len = ls.length;
				while (i < len) {
					if (re.test(key = ls.key(i++))) {
						if (!recursive) {
							Ti.API.error('Directory "' + path + '" not empty');
							return false;
						}
						ls.removeItem(key);
					}
				}
				this._exists = 0;
				ls.removeItem(metaPrefix + path);
				ls.removeItem(blobPrefix + path);
				return true;
			}
			return false;
		},

		deleteFile: function() {
			if (this.exists() && this.isFile() && !this.readonly) {
				var path = this.nativePath;
				this._exists = 0;
				ls.removeItem(metaPrefix + path);
				ls.removeItem(blobPrefix + path);
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
			var files = [];
			if (this.isDirectory()) {
				var path = this.nativePath + (/\/$/.test(this.nativePath) ? '' : slash),
					lsRegExp = new RegExp("^" + metaPrefix + path + "(.*)"),
					regRegExp = new RegExp("^" + path + "(.*)"),
					i = 0,
					len = ls.length;

				function add(s, re) {
					var file, match = s.match(re);
					match && match[1] && files.indexOf(file = match[1].split(slash)[0]) < 0 && files.push(file);
				}

				// check local storage
				while (i < len) {
					add(ls.key(i++), lsRegExp);
				}

				// check remote storage
				for (i in reg) {
					add(i, regRegExp);
				}
			}
			return files.sort();
		},

		isDirectory: function() {
			return this._type === 'D';
		},

		isFile: function() {
			return this._type === 'F';
		},

		modificationTimestamp: function() {
			return this._modified || null;
		},

		move: function() {
			return this.copy.apply(this, arguments) && this[this.isFile() ? "deleteFile" : "deleteDirectory"](1);
		},

		open: function(mode) {
			var FileStream = require("Ti/Filesystem/FileStream");
			return this.exists() && this.isFile() ? new FileStream({
				mode: mode,
				data: this.read().text
			}) : null;
		},

		read: function() {
			if (this.exists() && this.isFile()) {
				var path = this.nativePath,
					obj,
					data = this._remote ? (obj = getRemote(path)).data : getLocal(path) || "",
					defaultMimeType =  mimeTypes[mimeExtentions[this.extension()] || 0],
					type = obj && obj.mimeType || this._mimeType || defaultMimeType,
					i = 0,
					len = data.length,
					binaryData = '',
					params = {
						file: this,
						data: data,
						length: len,
						mimeType: type = type === "application/octet-stream" && type !== defaultMimeType ? defaultMimeType : type,
						nativePath: path
					};

				if (this._remote && _.isBinaryMimeType(type)) {
					while (i < len) {
						binaryData += String.fromCharCode(data.charCodeAt(i++) & 0xff);
					}
					params.data = btoa(binaryData);
				}

				return new Blob(params);
			}
			return null;
		},

		rename: function(name) {
			if (this.exists && !this.readonly) {
				var origPath = this.nativePath,
					path = origPath,
					blob = ls.getItem(blobPrefix + path),
					re = new RegExp("^ti:fs:(meta|blob):" + path + (/\/$/.test(path) ? '' : slash) + "(.*)"),
					match = path.match(pathRegExp),
					prefix = (match[1] ? match[1] : match[2] + match[3]) || slash,
					i = 0,
					len = ls.length,
					c = this.constants.__values__,
					dest,
					key;

				path = match[1] ? match[2] : match[4];

				if (!path) {
					Ti.API.error('Can\'t rename root "' + prefix + '"');
					return false;
				}

				path = path.split(slash);
				path.pop();
				path.push(name);

				dest = new File(path = prefix + path.join(slash));
				if (dest.exists() || dest.parent.readonly) {
					return false;
				}

				if (this._type === 'D') {
					while (i < len) {
						key = ls.key(i++);
						if (match = key.match(re)) {
							ls.setItem("ti:fs:" + match[1] + ":" + path + slash + match[2], ls.getItem(key));
							ls.removeItem(key);
						}
					}
				}

				this._save(path, name);
				blob && ls.setItem(blobPrefix + path, blob);
				ls.removeItem(metaPrefix + origPath);
				ls.removeItem(blobPrefix + origPath);

				return true;
			}
			return false;
		},

		resolve: function() {
			return this.nativePath;
		},

		spaceAvailable: function() {
			return "remainingSpace" in ls ? ls.remainingSpace : null;
		},

		write: function(/*String|File|Blob*/data, append) {
			var path = this.nativePath;
			if (path && this.isFile() && !this.readonly && this.parent && !this.parent.readonly) {
				data && is(data, "String") && (this._mimeType = mimeTypes[1]);
				switch (data && data.declaredClass) {
					case "Ti.Filesystem.File":
						data = data.read();
					case "Ti.Blob":
						this._mimeType = data.mimeType;
						data = data._data || "";
				}
				this._exists = 1;
				this._modified = Date.now();
				this._created || (this._created = this._modified);
				this.constants.__values__.size = setLocal(path, append ? this.read() + data : data);
				return this._save();
			}
			return false;
		},

		_create: function(type) {
			if (!this.exists() && this.parent && !this.parent.readonly && mkdirs(this.parent.nativePath)) {
				this._created = this._modified = Date.now();
				this._exists = 1;
				this._type = type;
				return this._save();
			}
			return false;
		},

		_save: function(path, name) {
			var path = path || this.nativePath,
				meta;
			if (path) {
				meta = ["n", name || this.name, "\nc", this._created, "\nm", this._modified, "\nt", this._type, "\ne0\nx0\nr", this.readonly|0, "\nl", this.symbolicLink|0, "\nh", this.hidden|0];
				this._type === 'F' && meta.push("\ns" + this.size);
				this._mimeType && meta.push("\ny" + this._mimeType);
				setLocal(path, meta.join(''), 1);
				return true;
			}
			return false;
		}

	});

});