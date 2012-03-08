define(function() {
	return {
		normalize: function(name) {
			return name;
		},

		load: function(name, require, onLoad, config) {
			var img = new Image();
			img.onload = img.onerror = function() {
				onLoad(img);
				delete img.onload;
				delete img.onerror;
			};
			img.src = require.toUrl(name);
		}
	};
});
