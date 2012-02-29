define(["Ti/_/declare", "Ti/IOStream"], function(declare, IOStream) {

	return declare("Ti.Filesystem.Filestream", IOStream, {

		constructor: function(args) {
			this._data = args && args.data;
		}

	});

});