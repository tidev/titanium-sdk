/**
 * hitch() and setObject() functionality based on code from Dojo Toolkit.
 *
 * Dojo Toolkit
 * Copyright (c) 2005-2011, The Dojo Foundation
 * New BSD License
 * <http://dojotoolkit.org>
 */

define(function() {
	var global = this,
		hitch,
		is = require.is;

	function toArray(obj, offset) {
		return [].concat(Array.prototype.slice.call(obj, offset||0));
	}

	function hitchArgs(scope, method) {
		var pre = toArray(arguments, 2);
			named = is(method, "String");
		return function() {
			var s = scope || global,
				f = named ? s[method] : method;
			return f && f.apply(s, pre.concat(toArray(arguments)));
		};
	}

	return {
		hitch: hitch = function(scope, method) {
			if (arguments.length > 2) {
				return hitchArgs.apply(global, arguments);
			}
			if (!method) {
				method = scope;
				scope = null;
			}
			if (is(method, "String")) {
				scope = scope || global;
				if (!scope[method]) {
					throw(['hitch: scope["', method, '"] is null (scope="', scope, '")'].join(''));
				}
				return function() {
					return scope[method].apply(scope, arguments || []);
				};
			}
			return !scope ? method : function() {
				return method.apply(scope, arguments || []);
			};
		},

		mixProps: function(dest, src, everything) {
			var d, i, p, v, special = { properties: 1, constants: 0 };
			for (p in src) {
				if (src.hasOwnProperty(p) && !/^(constructor|__values__)$/.test(p)) {
					if (p in special) {
						d = dest[p] || (dest[p] = {});
						d.__values__ || (d.__values__ = {});
						for (i in src[p]) {
							(function(property, externalDest, internalDest, valueDest, /* setter/getter, getter, or value */ descriptor, capitalizedName, writable) {
								var o = is(descriptor, "Object"),
									getter = o && is(descriptor.get, "Function") && descriptor.get,
									setter = o && is(descriptor.set, "Function") && descriptor.set,
									pt = o && is(descriptor.post),
									post = pt === "Function" ? descriptor.post : pt === "String" ? hitch(externalDest, descriptor.post) : 0;

								if (o && (getter || setter || post)) {
									valueDest[property] = descriptor.value;
								} else if (is(descriptor, "Function")) {
									getter = descriptor;
								} else {
									valueDest[property] = descriptor;
								}

								// first set the internal private interface
								Object.defineProperty(internalDest, property, {
									get: function() {
										return getter ? getter.call(externalDest, valueDest[property]) : valueDest[property];
									},
									set: function(v) {
										var args = [v, valueDest[property]];
										args[0] = valueDest[property] = setter ? setter.apply(externalDest, args) : v;
										post && post.apply(externalDest, args);
									},
									configurable: true,
									enumerable: true
								});

								// this is the public interface
								Object.defineProperty(dest, property, {
									get: function() {
										return internalDest[property];
									},
									set: function(v) {
										if (!writable) {
											throw new Error('Property "' + property + '" is read only');
										}
										internalDest[property] = v;
									},
									configurable: true,
									enumerable: true
								});

								if (require.has("declare-property-methods") && (writable || property.toUpperCase() !== property)) {
									externalDest["get" + capitalizedName] = function() { return internalDest[property]; };
									writable && (externalDest["set" + capitalizedName] = function(v) { return internalDest[property] = v; });
								}
							}(i, dest, d, d.__values__, src[p][i], i.substring(0, 1).toUpperCase() + i.substring(1), special[p]));
						}
					} else if (everything) {
						dest[p] = src[p];
					}
				}
			}
			return dest;
		},

		setObject: function(name) {
			var parts = name.split("."),
				q = parts.pop(),
				obj = window,
				i = 0,
				p = parts[i++];

			if (p) {
				do {
					obj = p in obj ? obj[p] : (obj[p] = {});
				} while (obj && (p = parts[i++]));
			}

			if (!obj || !q) {
				return;
			}
			q = q in obj ? obj[q] : (obj[q] = {});

			// need to mix args into values
			for (i = 1; i < arguments.length; i++) {
				is(arguments[i], "Object") ? this.mixProps(q, arguments[i], 1) : (q = arguments[i]);
			}

			return q;
		},

		toArray: toArray,

		urlEncode: function(obj) {
			var pairs = [],
				prop,
				value;

			for (prop in obj) {
				if (obj.hasOwnProperty(prop)) {
					is(value = obj[prop], "Array") || (value = [value]);
					prop = enc(prop) + "=";
					require.each(value, function(v) {
						pairs.push(prop + enc(v));
					});
				}
			}

			return pairs.join("&");
		},

		val: function(originalValue, defaultValue) {
			return is(originalValue, "Undefined") ? defaultValue : originalValue;
		}
	};
});