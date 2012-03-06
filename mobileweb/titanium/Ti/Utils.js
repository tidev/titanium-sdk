/**
 * This file contains source code from the following:
 *
 * Dojo Toolkit
 * Copyright (c) 2005-2011, The Dojo Foundation
 * New BSD License
 * <http://dojotoolkit.org>
 *
 * Version 2.1a Copyright Paul Johnston 2000 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * BSD License
 * <http://pajhome.org.uk/crypt/md5>
 */
 
 define(["Ti/_/encoding", "Ti/_/Evented", "Ti/_/lang"], function(encoding, Evented, lang) {

	function toWord(s, y) {
		var wa = [],
			i = 0,
			l = s.length * 8;
		for (; i < l; i += 8) {
			wa[i>>5] |= (s.charCodeAt(i / 8) & 255) << ((y ? y - i : i) % 32);
		}
		return wa;
	}

	function toString(wa, y) {
		var s = [],
			i = 0,
			l = wa.length * 32;
		for (; i < l; i += 8) {
			s.push(String.fromCharCode((wa[i >> 5] >>> ((y ? y - i : i) % 32)) & 255));
		}
		return s.join('');
	}

	function toHex(wa, y) {
		var h = "0123456789abcdef",
			i = 0,
			l = wa.length * 4,
			s = [];
		for (; i < l; i++) {
			s.push(h.charAt((wa[i>>2]>>(((y?y-i:i)%4)*8+4))&0xF)+h.charAt((wa[i>>2]>>(((y?y-i:i)%4)*8))&0xF));
		}
		return s.join('');
	}

	function addWords(a, b) {
		var l = (a & 0xFFFF) + (b & 0xFFFF),
			m = (a >> 16) + (b >> 16) + (l >> 16);
		return (m << 16) | (l & 0xFFFF);
	}

	function R(n,c) { return (n<<c) | (n>>>(32-c)); }
	function C(q,a,b,x,s,t) { return addWords(R(addWords(addWords(a, q), addWords(x, t)), s), b); }
	function FF(a,b,c,d,x,s,t) { return C((b&c)|((~b)&d),a,b,x,s,t); }
	function GG(a,b,c,d,x,s,t) { return C((b&d)|(c&(~d)),a,b,x,s,t); }
	function HH(a,b,c,d,x,s,t) { return C(b^c^d,a,b,x,s,t); }
	function II(a,b,c,d,x,s,t) { return C(c^(b|(~d)),a,b,x,s,t); }
	function FT(t,b,c,d) {
		if (t<20) { return (b&c)|((~b)&d); }
		if (t<40) { return b^c^d; }
		if (t<60) { return (b&c)|(b&d)|(c&d); }
		return b^c^d;
	}
	function KT(t) { return (t<20)?1518500249:(t<40)?1859775393:(t<60)?-1894007588:-899497514; }

	return lang.setObject("Ti.Utils", Evented, {

		base64decode: function(input) {
			return btoa(encoding.utf8encode(input));
		},

		base64encode: function(input) {
			return encoding.utf8decode(atob(input));
		},

		md5HexDigest: function(x) {
			var len = x.length * 8,
				a = 1732584193,
				b = -271733879,
				c = -1732584194,
				d = 271733878,
				i = 0,
				l;

			x = toWord(x);
			x[len >> 5] |= 0x80 << (len % 32);
			x[(((len + 64) >>> 9) << 4) + 14] = len;

			for (l = x.length; i < l; i += 16) {
				var olda = a, oldb = b, oldc = c, oldd = d;

				a = FF(a,b,c,d,x[i+ 0],7 ,-680876936);
				d = FF(d,a,b,c,x[i+ 1],12,-389564586);
				c = FF(c,d,a,b,x[i+ 2],17, 606105819);
				b = FF(b,c,d,a,x[i+ 3],22,-1044525330);
				a = FF(a,b,c,d,x[i+ 4],7 ,-176418897);
				d = FF(d,a,b,c,x[i+ 5],12, 1200080426);
				c = FF(c,d,a,b,x[i+ 6],17,-1473231341);
				b = FF(b,c,d,a,x[i+ 7],22,-45705983);
				a = FF(a,b,c,d,x[i+ 8],7 , 1770035416);
				d = FF(d,a,b,c,x[i+ 9],12,-1958414417);
				c = FF(c,d,a,b,x[i+10],17,-42063);
				b = FF(b,c,d,a,x[i+11],22,-1990404162);
				a = FF(a,b,c,d,x[i+12],7 , 1804603682);
				d = FF(d,a,b,c,x[i+13],12,-40341101);
				c = FF(c,d,a,b,x[i+14],17,-1502002290);
				b = FF(b,c,d,a,x[i+15],22, 1236535329);

				a = GG(a,b,c,d,x[i+ 1],5 ,-165796510);
				d = GG(d,a,b,c,x[i+ 6],9 ,-1069501632);
				c = GG(c,d,a,b,x[i+11],14, 643717713);
				b = GG(b,c,d,a,x[i+ 0],20,-373897302);
				a = GG(a,b,c,d,x[i+ 5],5 ,-701558691);
				d = GG(d,a,b,c,x[i+10],9 , 38016083);
				c = GG(c,d,a,b,x[i+15],14,-660478335);
				b = GG(b,c,d,a,x[i+ 4],20,-405537848);
				a = GG(a,b,c,d,x[i+ 9],5 , 568446438);
				d = GG(d,a,b,c,x[i+14],9 ,-1019803690);
				c = GG(c,d,a,b,x[i+ 3],14,-187363961);
				b = GG(b,c,d,a,x[i+ 8],20, 1163531501);
				a = GG(a,b,c,d,x[i+13],5 ,-1444681467);
				d = GG(d,a,b,c,x[i+ 2],9 ,-51403784);
				c = GG(c,d,a,b,x[i+ 7],14, 1735328473);
				b = GG(b,c,d,a,x[i+12],20,-1926607734);

				a = HH(a,b,c,d,x[i+ 5],4 ,-378558);
				d = HH(d,a,b,c,x[i+ 8],11,-2022574463);
				c = HH(c,d,a,b,x[i+11],16, 1839030562);
				b = HH(b,c,d,a,x[i+14],23,-35309556);
				a = HH(a,b,c,d,x[i+ 1],4 ,-1530992060);
				d = HH(d,a,b,c,x[i+ 4],11, 1272893353);
				c = HH(c,d,a,b,x[i+ 7],16,-155497632);
				b = HH(b,c,d,a,x[i+10],23,-1094730640);
				a = HH(a,b,c,d,x[i+13],4 , 681279174);
				d = HH(d,a,b,c,x[i+ 0],11,-358537222);
				c = HH(c,d,a,b,x[i+ 3],16,-722521979);
				b = HH(b,c,d,a,x[i+ 6],23, 76029189);
				a = HH(a,b,c,d,x[i+ 9],4 ,-640364487);
				d = HH(d,a,b,c,x[i+12],11,-421815835);
				c = HH(c,d,a,b,x[i+15],16, 530742520);
				b = HH(b,c,d,a,x[i+ 2],23,-995338651);

				a = II(a,b,c,d,x[i+ 0],6 ,-198630844);
				d = II(d,a,b,c,x[i+ 7],10, 1126891415);
				c = II(c,d,a,b,x[i+14],15,-1416354905);
				b = II(b,c,d,a,x[i+ 5],21,-57434055);
				a = II(a,b,c,d,x[i+12],6 , 1700485571);
				d = II(d,a,b,c,x[i+ 3],10,-1894986606);
				c = II(c,d,a,b,x[i+10],15,-1051523);
				b = II(b,c,d,a,x[i+ 1],21,-2054922799);
				a = II(a,b,c,d,x[i+ 8],6 , 1873313359);
				d = II(d,a,b,c,x[i+15],10,-30611744);
				c = II(c,d,a,b,x[i+ 6],15,-1560198380);
				b = II(b,c,d,a,x[i+13],21, 1309151649);
				a = II(a,b,c,d,x[i+ 4],6 ,-145523070);
				d = II(d,a,b,c,x[i+11],10,-1120210379);
				c = II(c,d,a,b,x[i+ 2],15, 718787259);
				b = II(b,c,d,a,x[i+ 9],21,-343485551);

				a = addWords(a, olda);
				b = addWords(b, oldb);
				c = addWords(c, oldc);
				d = addWords(d, oldd);
			}

			return toHex([a,b,c,d]);
		},

		sha1: function(x) {
			var len = x.length * 8,
				i = 0,
				j, k, l,
				w = new Array(80),
				a = 1732584193,
				b = -271733879,
				c = -1732584194,
				d = 271733878,
				e = -1009589776;

			x = toWord(x, 24);
			x[len >> 5] |= 0x80 << (24 - len % 32);
			x[((len + 64 >> 9) << 4) + 15] = len;

			for (l = x.length; i < l; i += 16) {
				var olda = a, oldb = b, oldc = c, oldd = d, olde = e;

				for (j = 0; j < 80; j++) {
					w[j] = j < 16 ? x[i + j] : R(w[j-3]^w[j-8]^w[j-14]^w[j-16], 1);
					k = addWords(addWords(R(a,5), FT(j,b,c,d)), addWords(addWords(e,w[j]), KT(j)));
					e = d;
					d = c;
					c = R(b, 30);
					b = a;
					a = k;
				}

				a = addWords(a, olda);
				b = addWords(b, oldb);
				c = addWords(c, oldc);
				d = addWords(d, oldd);
				e = addWords(e, olde);
			}

			return toHex([a, b, c, d, e], 3);
		},

		sha256: function() {
			//
		}

	});

});