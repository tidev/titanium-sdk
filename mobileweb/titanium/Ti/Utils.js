/**
 * This file contains source code from the following:
 *
 * Dojo Toolkit
 * Copyright (c) 2005-2011, The Dojo Foundation
 * New BSD License
 * <http://dojotoolkit.org>
 *
 * A JavaScript implementation of the RSA Data Security, Inc. MD5
 * Version 2.1a Copyright Paul Johnston 2000 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * BSD License
 * <http://pajhome.org.uk/crypt/md5/md5.html>
 *
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-256
 * Version 2.2 Copyright Angel Marin, Paul Johnston 2000 - 2009
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * BSD License
 * <http://pajhome.org.uk/crypt/md5/sha256.html>
 */

define(["Ti/_/encoding", "Ti/_/Evented", "Ti/_/lang", "Ti/Blob"], function(encoding, Evented, lang, Blob) {

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

	function padWords(x, len) {
		x = toWord(x, 24);
		x[len >> 5] |= 0x80 << (24 - len % 32);
		x[((len + 64 >> 9) << 4) + 15] = len;
		return x;
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

	function sha256_S (X, n) {return ( X >>> n ) | (X << (32 - n));}
	function sha256_Gamma0256(x) {return (sha256_S(x, 7) ^ sha256_S(x, 18) ^ (x >>> 3));}
	function sha256_Gamma1256(x) {return (sha256_S(x, 17) ^ sha256_S(x, 19) ^ (x >>> 10));}

	var sha256_K = [
		1116352408, 1899447441, -1245643825, -373957723, 961987163, 1508970993,
		-1841331548, -1424204075, -670586216, 310598401, 607225278, 1426881987,
		1925078388, -2132889090, -1680079193, -1046744716, -459576895, -272742522,
		264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986,
		-1740746414, -1473132947, -1341970488, -1084653625, -958395405, -710438585,
		113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291,
		1695183700, 1986661051, -2117940946, -1838011259, -1564481375, -1474664885,
		-1035236496, -949202525, -778901479, -694614492, -200395387, 275423344,
		430227734, 506948616, 659060556, 883997877, 958139571, 1322822218,
		1537002063, 1747873779, 1955562222, 2024104815, -2067236844, -1933114872,
		-1866530822, -1538233109, -1090935817, -965641998
	];

	function isBlob(it) {
		return it && it.declaredClass === "Ti.Blob";
	}

	function base64decode(input) {
		return atob(encoding.utf8encode(input));
	}

	function getData(x) {
		return isBlob(x) ? (x._isBinary ? base64decode(x._data) : x._data) : x;
	}

	return lang.setObject("Ti.Utils", Evented, {

		base64decode: function(/*String|Ti.Blob*/input) {
			// if input is a binary blob, no sense in decoding it since it would just be re-encoded again
			return isBlob(input) && input._isBinary ? input : new Blob({ data: base64decode(input._data || input) });
		},

		base64encode: function(/*String|Ti.Blob*/input) {
			// if input is a binary blob, then it's already base64 encoded
			return isBlob(input) && input._isBinary ? input : new Blob({ data: encoding.utf8decode(btoa(input._data || input)) });
		},

		md5HexDigest: function(/*String|Ti.Blob*/x) {
			var x = encoding.utf8encode(getData(x)),
				len = x.length * 8,
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

		sha1: function(/*String|Ti.Blob*/x) {
			var x = encoding.utf8encode(getData(x)),
				a = 1732584193,
				b = -271733879,
				c = -1732584194,
				d = 271733878,
				e = -1009589776,
				i = 0,
				j, k, l,
				w = new Array(80);

			x = padWords(x, x.length * 8);

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

		sha256: function(/*String|Ti.Blob*/x) {
			var x = encoding.utf8encode(getData(x)),
				a = 1779033703,
				b = -1150833019,
				c = 1013904242,
				d = -1521486534,
				e = 1359893119,
				f = -1694144372,
				g = 528734635,
				h = 1541459225,
				i = 0,
				j, l, T1, T2,
				w = new Array(64);

			x = padWords(x, x.length * 8);

			for (l = x.length; i < l; i += 16) {
				var olda = a, oldb = b, oldc = c, oldd = d, olde = e, oldf = f, oldg = g, oldh = h;

				for (j = 0; j < 64; j++) {
					w[j] = j < 16 ? x[i + j] : addWords(addWords(addWords(sha256_Gamma1256(w[j-2]), w[j-7]), sha256_Gamma0256(w[j-15])), w[j-16]);
					T1 = addWords(addWords(addWords(addWords(h, sha256_S(e, 6) ^ sha256_S(e, 11) ^ sha256_S(e, 25)), (e & f) ^ ((~e) & g)), sha256_K[j]), w[j]);
					T2 = addWords(sha256_S(a, 2) ^ sha256_S(a, 13) ^ sha256_S(a, 22), (a & b) ^ (a & c) ^ (b & c));
					h = g;
					g = f;
					f = e;
					e = addWords(d, T1);
					d = c;
					c = b;
					b = a;
					a = addWords(T1, T2);
				}

				a = addWords(a, olda);
				b = addWords(b, oldb);
				c = addWords(c, oldc);
				d = addWords(d, oldd);
				e = addWords(e, olde);
				f = addWords(f, oldf);
				g = addWords(g, oldg);
				h = addWords(h, oldh);
			}

			return toHex([a, b, c, d, e, f, g, h], 3);
		}

	});

});