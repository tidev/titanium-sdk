define(["Ti/_/declare", "Ti/_/lang"], function(declare, lang) {

	function parse(path) {
		var match = path.match(/(\/)?([^\:]*)(\:\/\/)?(.*)/),
			b = !match[1] && match[3];

		path = b ? match[4] : match[2];

		if (/^\.\./.test(path)) {
			throw new Error('Irrational path "' + path + '"');
		}

		return (b ? match[2] : "/") + path;
	}

	return declare("Ti._.Filesystem.Base", null, {

		constructor: function(args) {
			args = args || {};
			if (!require.is(args, "Object")) {
				var v = this.constants.__values__;
				v.name = (v.nativePath = parse(args)).split('/').pop();
			}
			this._type = args._type === 'D' ? 'D' : 'F';
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