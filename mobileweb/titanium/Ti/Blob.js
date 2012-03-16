define(["Ti/_/declare", "Ti/_/Evented"], function(declare, Evented) {

	return declare("Ti.Blob", Evented, {

		constructor: function(args) {
			args = args || {};
			this._data = args.data || "";
		},

		postscript: function() {
			var type = this.mimeType,
				img,
				v = this.constants.__values__;

			(this._isBinary = /^(application|image|audio|video)\//.test(type)) && (v.size = v.length);

			if (!type.indexOf("image/")) {
				img = new Image;
				require.on.once(img, "load", function() {
					v.width = img.width;
					v.height = img.height;
				});
				img.src = this.toString();
			}
		},

		append: function(/*String|Blob*/blob) {
			blob && (this._data = (this._data || "") + blob.toString());
		},

		toString: function() {
			return (this._isBinary ? "data:" + this.mimeType + ";base64," : "") + (this._data || "");
		},

		constants: {
			file: null,
			height: 0,
			length: 0,
			mimeType: "",
			nativePath: "",
			size: 0,
			text: function() {
				return this._isBinary ? null : this._data || "";
			},
			width: 0
		}

	});

});