define(["Ti/_/declare", "Ti/_/lang", "Ti/_/Evented"], function(declare, lang, Evented) {

	var Codec;

	function paramError(msg) {
		throw new Error("Missing " + msg + " argument");
	}

	function parse(type, value) {
		return type === Codec.TYPE_DOUBLE || type === Codec.TYPE_FLOAT ? parseFloat(value) : parseInt(value);
	}

	return Codec = lang.setObject("Ti.Codec", Evented, {

		decodeNumber: function(args) {
			(!args || !args.source) && paramError("source");
			args.type || paramError("type");
			return parse(args.type, args.source.buffer);
		},

		decodeString: function(args) {
			(!args || !args.source) && paramError("source");
			var b = args.source.buffer || "",
				p = args.position | 0,
				l = args.length;
			return b.substring(p, l && p + l);
		},

		encodeNumber: function(args) {
			(!args || !args.source) && paramError("source");
			args.dest || paramError("dest");
			args.type || paramError("type");
			return dest.append(new (require("Ti/Buffer"))({ buffer: ""+parse(args.type, args.source.buffer) }));
		},

		encodeString: function(args) {
			(!args || !args.source) && paramError("source");
			args.dest || paramError("dest");
			var b = args.source.buffer || "",
				p = args.destPosition | 0;
			b = new (require("Ti/Buffer"))({ buffer: b.substring(args.sourcePosition | 0, args.sourceLength || b.length) });
			return p ? dest.insert(b, p) : dest.append(b);
		},

		getNativeByteOrder: function() {
			return this.LITTLE_ENDIAN;
		},

		constants: {
			BIG_ENDIAN: 2,
			CHARSET_ASCII: "ascii",
			CHARSET_ISO_LATIN_1: "ios-latin-1",
			CHARSET_UTF16: "utf16",
			CHARSET_UTF16BE: "utf16be",
			CHARSET_UTF16LE: "utf16le",
			CHARSET_UTF8: "utf8",
			LITTLE_ENDIAN: 1,
			TYPE_BYTE: "byte",
			TYPE_DOUBLE: "double",
			TYPE_FLOAT: "float",
			TYPE_INT: "int",
			TYPE_LONG: "long",
			TYPE_SHORT: "short"
		}

	});

});