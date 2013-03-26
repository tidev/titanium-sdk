define(["Ti/_", "Ti/_/Evented", "Ti/_/lang", "Ti/Filesystem/File"],
	function(_, Evented, lang, File) {

	var applicationDataDirectory = "appdata://",
		tempDirectory = "tmp://";

	function join() {
		var re = /(.+:\/\/)?(.*)/,
			prefix = "",
			result = [],
			lastSegment,
			path = lang.toArray(arguments).filter(function(a) {
				return a !== void 0;
			}).map(function(a) {
				prefix || (prefix = a.match(re)) && (prefix = prefix[1] || "");
				return a.replace(prefix, "").replace(/^\/|\/$/g, '');
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

	function makeTemp(type) {
		var f = new File({
			_type: type.charAt(0),
			nativePath: tempDirectory + _.uuid()
		});
		return f["create" + type]() ? f : null;
	}

	return lang.setObject("Ti.Filesystem", Evented, {
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

		createTempDirectory: function() {
			return makeTemp("Directory");
		},

		createTempFile: function() {
			return makeTemp("File");
		},

		getFile: function() {
			return new File(join.apply(null, arguments));
		},

		isExternalStoragePresent: function() {
			return false;
		},

		openStream: function(mode) {
			var args = lang.toArray(arguments),
				file;
			args.shift();
			file = new File(join.apply(null, args));
			return file.open(mode);
		}
	});

});