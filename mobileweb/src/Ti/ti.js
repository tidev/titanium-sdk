(function(api){
	Ti._5.EventDriven(api);
	delete(this.removeEventListener);
	api.version = "1.7.0.RC2";
	api.buildDate = "__TIMESTAMP__";
	api.buildHash = "__GITHASH__";
	api.userAgent = "Appcelerator Titanium/"+api.version+" ("+navigator.userAgent+")";

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
