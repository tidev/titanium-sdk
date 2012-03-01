define(["Ti/_/declare", "Ti/_/Evented"], function(declare, Evented) {

	return declare("Ti.Blob", Evented, {

		constructor: function(args) {
			args = args || {};
			this._data = args.data || null;
			this._isBinary = args.size !== undefined;
		},

		append: function(blob) {
			blob && (this._data = (this._data || "") + blob.toString());
		},

		toString: function() {
			return (this._isBinary && !this.mimeType.indexOf("image/") ? "data:" + this.mimeType + ";base64," : "") + (this._data || "");
		},

		constants: {
			file: null,
			height: 0,
			length: 0,
			mimeType: "",
			nativePath: "",
			size: 0,
			text: function() {
				return this._data || "";
			},
			width: 0
		}

	});

});