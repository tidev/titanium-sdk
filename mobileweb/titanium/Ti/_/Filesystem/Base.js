define(["Ti/_/declare", "Ti/_/lang"], function(declare, lang) {

	function parse(path) {
		var match = path.match(/(\/)?([^\:]*)(\:\/\/)?(.*)/),
			b = !match[1] && match[3];

		path = b ? match[4] : match[2];

		if (/^\.\./.test(path)) {
			throw new Error('Irrational path "' + path + '"');
		}

		return (b ? match[2] : "resources") + path;
	}

	return declare("Ti._.Filesystem.Base", null, {

		constructor: function(path) {
			this.nativePath = parse(require.is(path, "Object") ? this.nativePath : path);
console.debug("new File() nativePath = [" + this.nativePath + "]");
			this._type = args._type === 'D' || 'F';
		},

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

	});

});