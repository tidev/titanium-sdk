/**
 * declare() functionality based on code from Dojo Toolkit.
 *
 * Dojo Toolkit
 * Copyright (c) 2005-2011, The Dojo Foundation
 * New BSD License
 * <http://dojotoolkit.org>
 */

define(['Ti/_', 'Ti/_/lang'], function(_, lang) {
	var classCounters = {},
		objProto = Object.prototype,
		fnRegExp = /^\d*|[^A-Za-z0-9_]*/g;

	function declare(className, superclass, definition) {
		var ctor,
			proto = {},
			ctors = [],
			tmp;

		if (typeof className != 'string') {
			definition = superclass;
			superclass = className;
			className = '';
		}

		proto.__def__ = definition = definition || {};

		tmp = definition.constructor;
		if (typeof tmp == 'function' && tmp !== objProto.constructor) {
			ctors.push(tmp);
		}

		if (typeof superclass == 'function') {
			tmp = superclass.prototype;
			tmp.__ctors__ && (ctors = ctors.concat(tmp.__ctors__));
			lang.mixProps(proto, tmp, 0, 1);
		} else if (superclass && typeof superclass == 'object') {
			lang.mixProps(proto, superclass, 0, 1);
		}

		proto.declaredClass = className;
		lang.mixProps(proto, definition);
		proto.__ctors__ = ctors;

		ctor = new Function('con', 'return function ' + (className && className.replace(fnRegExp, '') || 'AnonymousClass') + '(){con.apply(this,arguments);};')(function () {
			var dc = this.declaredClass,
				a = arguments,
				a0 = a[0],
				special = ['properties', 'constants'],
				def = this.__def__,
				i, c, type, descriptor,
				v = this.__values__ = {};

			// set the widget id
			if (dc) {
				classCounters[dc] || (classCounters[dc] = 0);
				this.widgetId = dc + ':' + (classCounters[dc]++);
			}

			// initialize the internal storage values
			for (i = 0; i < special.length; i++) {
				type = special[i];
				if (def[type]) {
					for (c in def[type]) {
						descriptor = def[type][c];
						if (descriptor && typeof descriptor == 'object' && (typeof descriptor.get == 'function' || typeof descriptor.set == 'function' || descriptor.post)) {
							v[type] || (v[type] = {});
							v[type][c] = descriptor.value;
						} else if (typeof descriptor != 'function') {
							v[type] || (v[type] = {});
							v[type][c] = descriptor;
						}
					}
				}
			}

			// call constructors
			for (i = ctors.length; i;) {
				ctors[--i].apply(this, a);
			}

			// mix in args, if any
			if (a0 && typeof a0 == 'object') {
				c = this.__values__.constants;
				for (i in a0) {
					(c && c.hasOwnProperty(i) ? c : this)[i] = a0[i];
				}
			}

			// add the toString() function for all our objects
			this.toString === objProto.toString && (this.toString = function() {
				return '[object ' + (dc ? dc.replace(/\./g, '') : 'Object') + ']';
			});

			// continue the original ritual: call the postscript
			f = this.postscript;
			f && f.apply(this, a);
		});

		ctor.prototype = proto;

		className && lang.setObject(className, ctor);

		return ctor;
	}

	return _.declare = declare;
});