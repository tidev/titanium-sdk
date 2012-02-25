define(["Ti/_", "Ti/_/Evented", "Ti/_/lang", "Ti/Filesystem/File"],
	function(_, Evented, lang, File) {

	return lang.setObject("Ti.Filesystem", Evented, {

		constants: {
			MODE_APPEND: 4,
			MODE_READ: 1,
			MODE_WRITE: 2,
			applicationDataDirectory: "appdata://",
			lineEnding: "\n",
			resourcesDirectory: "/",
			separator: "/",
			tempDirectory: "tmp://"
		},

		_join: function() {
			var each = require.each,
				args = lang.toArray(arguments),
				path = args.shift(),
				match = path.match(/(.+:\/\/)(.*)/),
				re = /\/$/,
				result = [],
				lastSegment;

			match && (path = match[2]);

			each(args, function(a) {
				re.test(path) || path && (path += '/');
				path += a.charAt(0) === '/' ? a.substring(1) : a;
			});

			path && each(path.split('/'), function(segment) {
				if (segment === ".." && lastSegment !== "..") {
					if (!result.length) {
						throw new Error('Irrational path "' + path + '"')
					}
					result.pop();
					lastSegment = result[result.length - 1];
				} else if (segment !== ".") {
					result.push(lastSegment = segment);
				}
			});

			return {
				name: result.pop() || "",
				nativePath: (result = (match && match[1] || "") + result.join('/')) + (re.test(result) ? '' : '/')
			};
		},

		createFile: function(args){
			return new File(args);
		},

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
			var args = lang.toArray(arguments);
			/:\/\//.test(args[0]) || args.unshift(this.resourcesDirectory);
			return new File(this._join.apply(this, args));
		},

		isExternalStoragePresent: function() {
			return false;
		}

	});

});