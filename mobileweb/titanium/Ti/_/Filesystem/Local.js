define(["Ti/_", "Ti/_/lang"], function(_, lang) {

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

	function get(bucket, key) {
		if (is(bucket, "Object")) {
			key = bucket.path.join('/');
			bucket = bucket.bucket;
		}
		return ls.getItem("ti:fs:" + bucket + ':' + key);
	}

	function set(obj) {
		ls.setItem("ti:fs:" + obj.bucket + ':' + obj.path + obj.name, obj);
	}

	function parse(path) {
		var match = path.match(/(\/)?([^\:]*)(\:\/\/)?(.*)/),
			b = !match[1] && match[3];

		path = b ? match[4] : match[2];

		if (/^\.\./.test(path)) {
			throw new Error('Irrational path "' + path + '"');
		}

		return {
			bucket: b ? match[2] : "resources",
			path: path.split('/')
		};
	}

	return lang.setObject("Ti._.Filesystem.Local", {

		exists: function(path) {
			return !!get(path);
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
			return result;
		}

	});

});