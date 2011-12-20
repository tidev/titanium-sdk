(function(api){
	Ti._5.EventDriven(api);
	delete api.removeEventListener;

	var ver = require.config.ti.version;

	require.mix(api, {
		version: ver,
		buildDate: "__TIMESTAMP__",
		buildHash: "__GITHASH__",
		userAgent: "Appcelerator Titanium/" + ver + " (" + navigator.userAgent + ")"
	});

	// Methods
	api.createBlob = function(){
		console.debug('Method "Titanium.createBlob" is not implemented yet.');
	};

	api.include = function(files){
		var i = 0;
		typeof files === "array" || (files = [].concat(Array.prototype.slice.call(arguments, 0)));
		for (; i < files.length; i++) {
			require("include!" + files[i]);
		}
	};
})(Ti);
