define(["Ti/_", "Ti/_/Evented", "Ti/_/lang", "Ti/Filesystem/File", "Ti/_/Filesystem/Local"],
	function(_, Evented, lang, File, localFS) {

	function tmpName() {
		return ((new Date()).getTime() & 0xFFFF).toString(16).toUpperCase()
	}

	return lang.setObject("Ti.Filesystem", Evented, {

		constants: {
			MODE_APPEND: 4,
			MODE_READ: 1,
			MODE_WRITE: 2,

			// iOS:       file://localhost/Users/chris/Library/Application%20Support/iPhone%20Simulator/5.0/Applications/F54567B1-B4B9-46EC-B9D1-6D89DAF703D0/Documents/
			// Android:   appdata-private://
			// MobileWeb: appdata://
			applicationDataDirectory: "appdata://",

			lineEnding: "\n",

			// iOS:       file://localhost/Users/chris/Library/Application%20Support/iPhone%20Simulator/5.0/Applications/F54567B1-B4B9-46EC-B9D1-6D89DAF703D0/funwithmodules.app/
			//            Note: this is marked writable on iOS!
			// Android:   app://
			// MobileWeb: resources://
			resourcesDirectory: "resources://",

			separator: "/",

			// iOS:       file://localhost/var/folders/14/_wzcmsd17pn76bzvb5lsmzr40000gn/T/
			// Android:   file:///mnt/sdcard/Android/data/com.appcelerator.cbarber/cache/_tmp
			// MobileWeb: tmp://
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
				type: isDir && 'D',
				name: tmpName(),
				nativePath: this.tempDirectory
			});
			localFS[isDir ? "mkdir" : "touch"](f.nativePath + f.name);
			return f;
		},

		createTempDirectory: function() {
			return this._makeTemp(1);
		},

		createTempFile: function() {
			return this._makeTemp();
		},

		getFile: function() {
			var args = lang.toArray(arguments);
			// TODO: if we don't have an absolute path, we need to know which include/require we're being called from which is really hard
			/:\/\//.test(args[0]) || args.unshift(this.resourcesDirectory);
			return new File(this._join.apply(this, args));
		},

		isExternalStoragePresent: function() {
			return false;
		}

	});

});