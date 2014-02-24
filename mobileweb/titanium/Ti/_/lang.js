/**
 * hitch() and setObject() functionality based on code from Dojo Toolkit.
 *
 * Dojo Toolkit
 * Copyright (c) 2005-2011, The Dojo Foundation
 * New BSD License
 * <http://dojotoolkit.org>
 */

define(['Ti/_/has'], function (has) {
	var global = this,
		hitch,
		is = require.is;

	function toArray(obj, offset) {
		return [].concat(Array.prototype.slice.call(obj, offset||0));
	}

	function hitchArgs(scope, method) {
		var pre = toArray(arguments, 2),
			named = typeof method == 'string';
		return function () {
			var s = scope || global,
				f = named ? s[method] : method;
			return f && f.apply(s, pre.concat(toArray(arguments)));
		};
	}

	return {
		hitch: hitch = function (scope, method) {
			if (arguments.length > 2) {
				return hitchArgs.apply(global, arguments);
			}
			if (!method) {
				method = scope;
				scope = null;
			}
			if (typeof method == 'string') {
				scope = scope || global;
				if (!scope[method]) {
					throw(['hitch: scope["', method, '"] is null (scope="', scope, '")'].join(''));
				}
				return function () {
					return scope[method].apply(scope, arguments || []);
				};
			}
			return !scope ? method : function () {
				return method.apply(scope, arguments || []);
			};
		},

		isDef: function (it) {
			return it !== void 0;
		},

		mixProps: function (dest, src, setDefaults, copyDefs) {
			var prop, propObj, name, destDef, destExists,
				srcDef = src.__def__,
				source = srcDef || src,
				ignore = /^constructor|__values__|__def__|declaredClass$/,
				special = { properties: 1, constants: 0 };

			// copyDefs is only true if declare() is mixing in a superclass
			copyDefs && dest.__def__ || (dest.__def__ = {});

			for (prop in source) {
				if (source.hasOwnProperty(prop) && !ignore.test(prop)) {
					// check if this prop is "properties" or "constants"
					if (special.hasOwnProperty(prop)) {
						// this is where we store original source property's definition
						destDef = dest.__def__[prop] || (dest.__def__[prop] = {});

						// loop over each prop in the source
						propObj = source[prop];
						for (name in propObj) {
							destExists = destDef.hasOwnProperty(name);

							// don't copy props that already exist in the destination
							if (!srcDef || !destExists) {
								// copy the original source property's definition
								destExists || (destDef[name] = propObj[name]);

								// define and call the function that wires up the properties
								(function (type, property, /* setter/getter, getter, or value */ descriptor, capitalizedName, writable) {
									var isObj = descriptor && typeof descriptor == 'object',
										getter = isObj && descriptor.get,
										setter = isObj && descriptor.set,
										post = isObj && descriptor.post,
										desc = {
											get: function () {
												var v = this.__values__[type][property];
												return getter ? (typeof getter == 'string' ? this[getter] : getter).call(this, v) : v;
											},
											set: function (v) {
												if (!writable) {
													throw new Error('Property "' + property + '" is read only');
												}
												var d = this.__values__[type],
													args = [v, d[property], property];
												args[0] = d[property] = setter ? (typeof setter == 'string' ? this[setter] : setter).apply(this, args) : v;
												post && (typeof post == 'function' ? post : this[post]).apply(this, args);
											},
											configurable: true,
											enumerable: true
										};

									if (isObj && (getter || setter || post)) {
										setDefaults && (dest.__values__[type][property] = descriptor.value);
									} else if (typeof descriptor == 'function') {
										getter = descriptor;
									} else if (setDefaults) {
										dest.__values__[type][property] = descriptor;
									}

									Object.defineProperty(dest, property, desc);

									// if it's writable or it's not an uppercase constant name, create the getter/setter
									if (writable || property.toUpperCase() !== property) {
										dest['get' + capitalizedName] = desc.get;
										writable && (dest['set' + capitalizedName] = desc.set);
									}
								}(prop, name, propObj[name], name.substring(0, 1).toUpperCase() + name.substring(1), special[prop]));
							}
						}
					} else if (!srcDef || ((!srcDef.properties || !srcDef.properties.hasOwnProperty(prop)) && (!srcDef.constants || !srcDef.constants.hasOwnProperty(prop)))) {
						copyDefs && dest.__def__.hasOwnProperty(prop) || (dest.__def__[prop] = source[prop]);
						dest[prop] = source[prop];
					}
				}
			}
			return dest;
		},

		generateAccessors: function (definition, readOnlyProps, props) {
			function generateGetter(prop) {
				var getterName = 'get' + prop.substring(0, 1).toUpperCase() + prop.substring(1);
				if (!(getterName in definition.prototype)) {
					definition.prototype[getterName] = function () {
						return this[prop];
					}
				}
			}
			
			function generateSetter(prop) {
				var setterName = 'set' + prop.substring(0, 1).toUpperCase() + prop.substring(1);
				if (!(setterName in definition.prototype)) {
					definition.prototype[setterName] = function (value) {
						return this[prop] = value;
					}
				}
			}
			
			readOnlyProps && readOnlyProps.split(',').forEach(generateGetter);
			props && props.split(',').forEach(function (prop) {
				generateGetter(prop);
				generateSetter(prop);
			});
		},

		setObject: function (name) {
			var parts = name.split('.'),
				q = parts.pop(),
				obj = window,
				i = 0,
				p = parts[i++],
				a,
				r;

			if (p) {
				do {
					obj = p in obj ? obj[p] : (obj[p] = {});
				} while (obj && (p = parts[i++]));
			}

			if (obj && q) {
				r = q in obj ? obj[q] : {};
				// need to mix args into values
				for (i = 1; i < arguments.length; i++) {
					a = arguments[i];
					if (a && typeof a == 'object') {
						// if the destination is a plain object, then we need to initialize the property store
						r.__values__ || (r.__values__ = { constants:{}, properties:{} });

						// mix the props
						this.mixProps(r, a, 1);
					} else {
						r = a;
					}
				}
			}

			return obj[q] = r;
		},

		toArray: toArray,

		urlEncode: function (obj) {
			var enc = encodeURIComponent,
				pairs = [],
				prop,
				value,
				i,
				l;

			for (prop in obj) {
				if (obj.hasOwnProperty(prop)) {
					Array.isArray(value = obj[prop]) || (value = [value]);
					prop = enc(prop) + '=';
					for (i = 0, l = value.length; i < l;) {
						pairs.push(prop + enc(value[i++]));
					}
				}
			}

			return pairs.join('&');
		},

		val: function (originalValue, defaultValue) {
			return originalValue === void 0 ? defaultValue : originalValue;
		}
	};
});