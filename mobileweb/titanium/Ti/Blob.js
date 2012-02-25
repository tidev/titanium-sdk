define(["Ti/_/declare", "Ti/_/Evented"], function(declare, Evented) {

	return declare("Ti.Blob", Evented, {

		constructor: function(args) {
			args = args || {};
			var data = this.data = args.data || null;
			(this.isBinary = !!args.isBinary) || (this.text = data || "");
		},

		append: function(blob) {
			this.text && blob.text && (this.constants.__values__.text += ""+blob.text);
		},

		toString: function() {
			return this.text;
		},

		constants: {
			height: 0,
			length: 0,
			mimeType: "",
			nativePath: "",
			size: 0,
			text: null,
			width: 0
		}

	});

});