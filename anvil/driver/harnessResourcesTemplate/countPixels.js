// Pixel counter class that exposes helper functions to facilitate canvas analysis.

var h2c = require("h2c");

function CountPixels() {
	var allPixels,
		// Color value tolerance. Some browsers report colors slightly different
		// than actual HTML entity color (color profiling). We assume colors are
		// equal if they differ in less than e.
		e = 15,
		Eps2 = Math.pow(e, 2);
		   
	function compareArrays(arr0, arr) {
		var sum2 = 0,
			res = false,
			i = 0,
			len = arr0.length;

		for (; i < len; i++) {
			sum2 += Math.pow((arr0[i] - arr[i]), 2);
		}

		(sum2 < Eps2) && (res = true);

		return res;
	}
	
	function compareArrays(arr0, arr) {
		var sum2 = 0,
			res = false,
			i = 0,
			len = arr0.length;

		for (; i < len; i++) {
			sum2 += Math.pow((arr0[i] - arr[i]), 2);
		}

		(sum2 < Eps2) && (res = true);
		
		return res;
	}
	
	// countPixels: count how many pixels of color "pixelcolor" there are in
	// the HTML element "el", optionally constrained with "rectangle".
	// The rectangle parameter: object with properties "left", "top", "width", "height".
	// The rectangle parameter, or any of its properties, is optional.
	this.countPixels = function(pixelColor, el, callback, rectangle) {
		var options = {
				allowTaint: true, taintTest: false
			},
			nEl = el.domNode ? el.domNode : el;

		options.onrendered = function(canvasObject) {
			var count = 0,
				c = canvasObject.getContext('2d'),
				p,
				wl = canvasObject.width,
				hl = canvasObject.height,
				pixel = [];
				
			// Validation of "rectangle" begin
			(typeof rectangle !== 'object') && (rectangle = {});

			var x = rectangle.left || 0,
				y = rectangle.top || 0,
				w, 
				h;

			if ((x > wl) || (y > hl)) {
				Ti.API.info('The rectangle of the chosen area is out of the element area');
			}

			w = rectangle.width ? Math.min(wl, x + rectangle.width) : wl;
			h = rectangle.width ? Math.min(hl, x + rectangle.width) : hl;

			// Validation of "rectangle" end
			allPixels = w * h;
			p = c.getImageData(x, y, w, h).data;

			for (var i = 0, len = p.length; i < len; i += 4) {
				pixel[0] = p[i];
				pixel[1] = p[i + 1];
				pixel[2] = p[i + 2];
				
				compareArrays(pixelColor, pixel) && count++;
			}

			callback(count);
		}

		h2c([nEl], options);
	};
	
	this.countPixelsPercentage = function(pixelColor, el, callback) {
		var elCB = function(count) {
			var percentsavings = Math.round((count/allPixels) * 100);

			callback(percentsavings);
		}

		this.countPixels(pixelColor, el, elCB);
	};
}