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
		/* coming soon!
		var i = 0;
		typeof files === "array" || (files = [].concat(Array.prototype.slice.call(arguments, 0)));
		for (; i < files.length; i++) {
			require("include!" + files[i]);
		}
		*/

		var head = document.getElementsByTagName('head')[0];
		if(head == null){
			head = document;
		}

		for (var i = 0; i < arguments.length; i++){
			var location = arguments[i];

			var script = Ti._5.getLoadedScript(location);
			if ('undefined' != typeof script) {
				return Ti._5.execLoadedScript(location);
			}

			var absLocation = Ti._5.getAbsolutePath(location);
			var xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function() {
				if (xhr.readyState == 4) {
					if (xhr.status == 200) {
						Ti._5.addLoadedScript(location, xhr.responseText);
						return Ti._5.execLoadedScript(location);
					}
				}
			};
			xhr.open("POST", absLocation, false);
			xhr.setRequestHeader("Access-Control-Allow-Origin","*");
			xhr.setRequestHeader("Content-Type", "text/xml; charset=utf-8");
			xhr.send(null);
			xhr = null;
		}
	};
})(Ti);
