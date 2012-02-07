define(function() {
	// Pre-calculate the screen DPI
	var body = document.body,
		measureDiv = document.createElement('div'),
		dpi;
	measureDiv.style.width = "1in";
	measureDiv.style.visibility = "hidden";
	body.appendChild(measureDiv);
	dpi = parseInt(measureDiv.clientWidth);
	body.removeChild(measureDiv);

	return {
		assert: function(test, msg) {
			if (!test) {
				throw new Error(msg);
			}
		},
		dpi: dpi,
		getAbsolutePath: function(path) {
			/^app\:\/\//.test(path) && (path = path.substring(6));
			/^\//.test(path) && (path = path.substring(1));
			return /^\/\//.test(path) || path.indexOf("://") > 0 ? path : location.pathname.replace(/(.*)\/.*/, "$1") + "/" + path;
		},
		uuid: function() {
			/**
			 * Math.uuid.js (v1.4)
			 * Copyright (c) 2010 Robert Kieffer
			 * Dual licensed under the MIT and GPL licenses.
			 * <http://www.broofa.com>
			 * mailto:robert@broofa.com
			 */
			// RFC4122v4 solution:
			return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
				var r = Math.random() * 16 | 0,
					v = c == 'x' ? r : (r & 0x3 | 0x8);
				return v.toString(16);
			}).toUpperCase();
		}
	};
});