define(["Ti/_/lang"], function(lang) {

	var fromCharCode = String.fromCharCode,
		x = 128;

	return lang.setObject("Ti._.encoding", {

		utf8encode: function(str) {
			var c,
				str = str.replace(/\r\n/g,"\n"),
				i = 0,
				len = str.length,
				bytes = [];

			while (i < len) {
				c = str.charCodeAt(i++);

				if (c < x) {
					bytes.push(fromCharCode(c));
				} else if((c >= x) && (c < 2048)) {
					bytes.push(fromCharCode((c >> 6) | 192));
					bytes.push(fromCharCode((c & 63) | x));
				} else {
					bytes.push(fromCharCode((c >> 12) | 224));
					bytes.push(fromCharCode(((c >> 6) & 63) | x));
					bytes.push(fromCharCode((c & 63) | x));
				}
			}

			return bytes.join('');
		},

		utf8decode: function(bytes) {
			var str = [],
				i = 0,
				len = bytes.length,
				c,
				c2;

			while (i < len) {
				c = bytes.charCodeAt(i);
				if (c < x) {
					str.push(fromCharCode(c));
					i++;
				} else {
					c2 = bytes.charCodeAt(i+1);
					if(c > 191 && c < 224) {
						str.push(fromCharCode(((c & 31) << 6) | (c2 & 63)));
						i += 2;
					} else {
						str.push(fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (bytes.charCodeAt(i+2) & 63)));
						i += 3;
					}
				}
			}

			return str.join('');
		}

	});

});