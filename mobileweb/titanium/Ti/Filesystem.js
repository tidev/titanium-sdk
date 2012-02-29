define(["Ti/_", "Ti/_/Evented", "Ti/_/lang", "Ti/Filesystem/File"],
	function(_, Evented, lang, File) {

	function join() {
		var re = /(.+:\/\/)?(.*)/,
			prefix = "",
			result = [],
			lastSegment,
			path = lang.toArray(arguments).map(function(arg) {
				prefix || (prefix = arg.match(re)) && (prefix = prefix[1] || "");
				return arg.replace(prefix, "").replace(/^\/|\/$/g, '');
			}).join('/');

		// compact the path
		path.split('/').forEach(function(segment) {
			if (segment === ".." && lastSegment !== "..") {
				if (!result.length) {
					throw new Error('Irrational path "' + path + '"')
				}
				result.pop();
				lastSegment = result[result.length - 1];
			} else if (segment && segment !== ".") {
				result.push(lastSegment = segment);
			}
		});

		// re-assemble path
		path = prefix + result.join('/');
		if (!prefix && !/^\//.test(path)) {
			path = '/' + path;
		}

		return path;
	}

	var applicationDataDirectory = "appdata://",
		tempDirectory = "tmp://",
		Filesystem = lang.setObject("Ti.Filesystem", Evented, {
			constants: {
				MODE_APPEND: 4,
				MODE_READ: 1,
				MODE_WRITE: 2,
				applicationDataDirectory: applicationDataDirectory,
				lineEnding: '\n',
				resourcesDirectory: '/',
				separator: '/',
				tempDirectory: tempDirectory
			},

			protocols: ["appdata", "tmp"],

			_makeTemp: function(isDir) {
				var f = new File({
					_type: isDir && 'D',
					nativePath: this.tempDirectory + ((new Date()).getTime() & 0xFFFF).toString(16).toUpperCase()
				});
				return f[isDir ? "createDirectory" : "createFile"]();
			},

			createTempDirectory: function() {
				return this._makeTemp(1);
			},

			createTempFile: function() {
				return this._makeTemp();
			},

			getFile: function() {
				return new File(join.apply(null, arguments));
			},

			isExternalStoragePresent: function() {
				return false;
			}
		});

	// initialize the filesystem
	function initRoot(path, readonly) {
		var f = new File({
			nativePath: path,
			readonly: readonly
		});
		f.exists() || f.createDirectory();
	}
	initRoot(applicationDataDirectory);
	initRoot(tempDirectory);

	return Filesystem;

});