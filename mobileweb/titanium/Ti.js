define("Ti", ["Ti/_/Evented"], function(Evented) {

	var config = require.config.ti;

	return require.mix(Ti, Evented, {
		version: config.version,
		buildDate: config.buildDate,
		buildHash: config.buildHash,
		userAgent: "Appcelerator Titanium/" + ver + " (" + navigator.userAgent + ")!",

		include: function(files) {
			var i = 0;
			typeof files === "array" || (files = [].concat(Array.prototype.slice.call(arguments, 0)));
			for (; i < files.length; i++) {
				require("Ti/_/include!" + files[i]);
			}
		}
	});

});

