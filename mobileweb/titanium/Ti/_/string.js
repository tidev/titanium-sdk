/**
 * String.format() functionality based on dojox.string code from Dojo Toolkit.
 *
 * Dojo Toolkit
 * Copyright (c) 2005-2011, The Dojo Foundation
 * New BSD License
 * <http://dojotoolkit.org>
 */

define(["Ti/_", "Ti/_/has", "Ti/_/lang"], function(_, has, lang) {

	var assert = _.assert,
		is = require.is,
		mix = require.mix,
		isOpera = has("opera"),
		zeros10 = "0000000000",
		spaces10 = "          ",
		specifiers = {
			b: {
				base: 2,
				isInt: 1
			},
			o: {
				base: 8,
				isInt: 1
			},
			x: {
				base: 16,
				isInt: 1
			},
			X: {
				extend: ["x"],
				toUpper: 1
			},
			d: {
				base: 10,
				isInt: 1
			},
			i: {
				extend: ["d"]
			},
			u: {
				extend: ["d"],
				isUnsigned: 1
			},
			c: {
				setArg: function(token) {
					if (!isNaN(token.arg)) {
						var num = parseInt(token.arg);
						assert(num < 0 || num > 127, "Invalid character code passed to %c in sprintf");
						token.arg = isNaN(num) ? "" + num : String.fromCharCode(num);
					}
				}
			},
			s: {
				setMaxWidth: function(token) {
					token.maxWidth = token.period === "." ? token.precision : -1;
				}
			},
			e: {
				isDouble: 1
			},
			E: {
				extend: ["e"],
				toUpper: 1
			},
			f: {
				isDouble: 1
			},
			F: {
				extend: ["f"]
			},
			g: {
				isDouble: 1
			},
			G: {
				extend: ["g"],
				toUpper: 1
			}
		};

	function pad(token, length, padding) {
		var tenless = length - 10,
			pad;

		is(token.arg, "String") || (token.arg = "" + token.arg);

		while (token.arg.length < tenless) {
			token.arg = token.rightJustify ? token.arg + padding : padding + token.arg;
		}

		pad = length - token.arg.length;
		token.arg = token.rightJustify ? token.arg + padding.substring(0, pad) : padding.substring(0, pad) + token.arg;
	}

	function zeroPad(token, length) {
		pad(token, lang.val(length, token.precision), zeros10);
	}

	function spacePad(token, length) {
		pad(token, lang.val(length, token.minWidth), spaces10);
	}

	function fitField(token) {
		token.maxWidth >= 0 && token.arg.length > token.maxWidth ? token.arg.substring(0, token.maxWidth) : token.zeroPad ? zeroPad(token, token.minWidth) : spacePad(token);
	}

	function formatInt(token) {
		var i = parseInt(token.arg);

		if (!isFinite(i)) {
			// allow this only if arg is number
			assert(!is(token.arg, "Number"), "Format argument '" + token.arg + "' not an integer; parseInt returned " + i);
			i = 0;
		}

		// if not base 10, make negatives be positive
		// otherwise, (-10).toString(16) is '-a' instead of 'fffffff6'
		i < 0 && (token.isUnsigned || token.base != 10) && (i = 0xffffffff + i + 1);

		if (i < 0) {
			token.arg = (-i).toString(token.base);
			zeroPad(token);
			token.arg = "-" + token.arg;
		} else {
			token.arg = i.toString(token.base);
			// need to make sure that argument 0 with precision==0 is formatted as ''
			i || token.precision ? zeroPad(token) : (token.arg = "");
			token.sign && (token.arg = token.sign + token.arg);
		}
		if (token.base === 16) {
			token.alternative && (token.arg = '0x' + token.arg);
			token.arg = token.toUpper ? token.arg.toUpperCase() : token.arg.toLowerCase();
		}
		token.base === 8 && token.alternative && token.arg.charAt(0) != '0' && (token.arg = '0' + token.arg);
	}

	function formatDouble(token) {
		var f = parseFloat(token.arg);

		if (!isFinite(f)) {
			// allow this only if arg is number
			assert(!is(token.arg, "Number"), "Format argument '" + token.arg + "' not a float; parseFloat returned " + f);
			// C99 says that for 'f':
			//   infinity -> '[-]inf' or '[-]infinity' ('[-]INF' or '[-]INFINITY' for 'F')
			//   NaN -> a string  starting with 'nan' ('NAN' for 'F')
			// this is not commonly implemented though.
			f = 0;
		}

		switch (token.specifier) {
			case 'e':
				token.arg = f.toExponential(token.precision);
				break;
			case 'f':
				token.arg = f.toFixed(token.precision);
				break;
			case 'g':
				// C says use 'e' notation if exponent is < -4 or is >= prec
				// ECMAScript for toPrecision says use exponential notation if exponent is >= prec,
				// though step 17 of toPrecision indicates a test for < -6 to force exponential.
				if(Math.abs(f) < 0.0001){
					//print("forcing exponential notation for f=" + f);
					token.arg = f.toExponential(token.precision > 0 ? token.precision - 1 : token.precision);
				}else{
					token.arg = f.toPrecision(token.precision);
				}

				// In C, unlike 'f', 'gG' removes trailing 0s from fractional part, unless alternative format flag ("#").
				// But ECMAScript formats toPrecision as 0.00100000. So remove trailing 0s.
				if(!token.alternative){
					//print("replacing trailing 0 in '" + s + "'");
					token.arg = token.arg.replace(/(\..*[^0])0*/, "$1");
					// if fractional part is entirely 0, remove it and decimal point
					token.arg = token.arg.replace(/\.0*e/, 'e').replace(/\.0$/,'');
				}
				break;
			default:
				throw new Error("Unexpected double notation '" + token.doubleNotation + "'");
		}

		// C says that exponent must have at least two digits.
		// But ECMAScript does not; toExponential results in things like "1.000000e-8" and "1.000000e+8".
		// Note that s.replace(/e([\+\-])(\d)/, "e$10$2") won't work because of the "$10" instead of "$1".
		// And replace(re, func) isn't supported on IE50 or Safari1.
		token.arg = token.arg.replace(/e\+(\d)$/, "e+0$1").replace(/e\-(\d)$/, "e-0$1");

		// Ensure a '0' before the period.
		// Opera implements (0.001).toString() as '0.001', but (0.001).toFixed(1) is '.001'
		isOpera && (token.arg = token.arg.replace(/^\./, '0.'));

		// if alt, ensure a decimal point
		if (token.alternative) {
			token.arg = token.arg.replace(/^(\d+)$/,"$1.");
			token.arg = token.arg.replace(/^(\d+)e/,"$1.e");
		}

		f >= 0 && token.sign && (token.arg = token.sign + token.arg);
		token.arg = token.toUpper ? token.arg.toUpperCase() : token.arg.toLowerCase();
	}

	String.format = function(format) {
		var args = lang.toArray(arguments),
			re = /\%(?:\(([\w_]+)\)|([1-9]\d*)\$)?([0 +\-\#]*)(\*|\d+)?(\.)?(\*|\d+)?[hlL]?([\%scdeEfFgGiouxX])/g,
			tokens = [],
			sequence,
			mapped = 0,
			match,
			copy,
			content,
			lastIndex = 0,
			position = 0,
			str = "",
			keys = ["mapping", "intmapping", "flags", "_minWidth", "period", "_precision", "specifier"];

		// tokenize
		while (match = re.exec(format)) {
			content = format.slice(lastIndex, re.lastIndex - match[0].length);
			content.length && tokens.push(content);
			if (isOpera) {
				copy = match.slice(0);
				while (copy.length < match.length) {
					copy.push(null);
				}
				match = copy;
			}
			sequence = {};
			match.slice(1).concat(tokens.length).map(function(x, y) {
				keys[y] && (sequence[keys[y]] = x);
			});
			tokens.push(sequence);
			sequence[0] && mapped++;
			lastIndex = re.lastIndex;
		}
		content = format.slice(lastIndex);
		content.length && tokens.push(content);

		// strip off the format
		args.shift();
		assert(!mapped || args.length, "Format has no mapped arguments");

		tokens.forEach(function(token) {
			var tf,
				flags = {},
				fi,
				flag,
				mixins = specifiers[token.specifier];

			if (is(token, "String")) {
				str += token;
			} else {
				if (mapped) {
					assert(args[token.mapping] === void 0, "Missing key " + token.mapping);
				} else {
					token.intmapping && (position = parseInt(token.intmapping) - 1);
					assert(position < args.length, "Got " + args.length + " format arguments, insufficient for '" + format + "'");
				}
				token.arg = args[mapped ? token.mapping : position++];

				if (!token.compiled) {
					mix(token, {
						compiled: 1,
						sign: "",
						zeroPad: 0,
						rightJustify: 0,
						alternative: 0,
						minWidth: token._minWidth | 0,
						maxWidth: -1,
						toUpper: 0,
						isUnsigned: 0,
						isInt: 0,
						isDouble: 0,
						precision: token.period === '.' ? token._precision | 0 : 1
					});

					for (tf = token.flags, fi = tf.length; fi--;) {
						flags[flag = tf.charAt(fi)] = 1;
						switch (flag) {
							case " ":
								token.sign = " ";
								break;
							case "+":
								token.sign = "+";
								break;
							case "0":
								token.zeroPad = !flags["-"];
								break;
							case "-":
								token.rightJustify = 1;
								token.zeroPad = 0;
								break;
							case "\#":
								token.alternative = 1;
								break;
							default:
								throw new Error("Bad formatting flag '" + flag + "'");
						}
					}

					assert(mixins !== void 0, "Unexpected specifier '" + token.specifier + "'");

					if (mixins.extend) {
						mix(mixins, specifiers[mixins.extend]);
						delete mixins.extend;
					}
					mix(token, mixins);
				}

				is(token.setArg, "Function") && token.setArg(token);
				is(token.setMaxWidth, "Function") && token.setMaxWidth(token);

				if (token._minWidth === "*") {
					assert(mapped, "* width not supported in mapped formats");
					assert(isNaN(token.minWidth = parseInt(args[position++])), "The argument for * width at position " + position + " is not a number in " + this._format);
					// negative width means rightJustify
					if (token.minWidth < 0) {
						token.rightJustify = 1;
						token.minWidth = -token.minWidth;
					}
				}

				if(token._precision === "*" && token.period === "."){
					assert(mapped, "* precision not supported in mapped formats");
					assert(isNaN(token.precision = parseInt(args[position++])), "The argument for * precision at position " + position + " is not a number in " + this._format);
					// negative precision means unspecified
					if (token.precision < 0) {
						token.precision = 1;
						token.period = '';
					}
				}

				if (token.isInt) {
					// a specified precision means no zero padding
					token.period === '.' && (token.zeroPad = 0);
					formatInt(token);
				} else if(token.isDouble) {
					token.period !== '.' && (token.precision = 6);
					formatDouble(token);
				}

				fitField(token);

				str += "" + token.arg;
			}
		});

		return str;
	};

	return {
		capitalize: function(s) {
			s = s || "";
			return s.substring(0, 1).toUpperCase() + s.substring(1);
		},

		trim: String.prototype.trim ?
			function(str){ return str.trim(); } :
			function(str){ return str.replace(/^\s\s*/, '').replace(/\s\s*$/, ''); }
	};

});