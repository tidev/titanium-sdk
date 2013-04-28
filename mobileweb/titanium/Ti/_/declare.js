/**
 * declare() functionality based on code from Dojo Toolkit.
 *
 * Dojo Toolkit
 * Copyright (c) 2005-2011, The Dojo Foundation
 * New BSD License
 * <http://dojotoolkit.org>
 */

define(['Ti/_', 'Ti/_/lang'], function(_, lang) {
	var mix = require.mix,
		counter = 0,
		classCounters = {},
		objProto = Object.prototype,
		specialPropsRegExp = /^constructor|properties|constants|__values__$/;

	// C3 Method Resolution Order (see http://www.python.org/download/releases/2.3/mro/)
	function c3mro(bases, className) {
		var result = [],
			roots = [ {cls: 0, refs: []} ],
			nameMap = {},
			clsCount = 1,
			l = bases.length,
			i = 0,
			j, lin, base, top, proto, rec, name, refs;

		// build a list of bases naming them if needed
		for (; i < l; ++i) {
			base = bases[i];
			if (!base) {
				throw new Error('Unknown base class for "' + className + '" [' + i + ']');
			} else if (typeof base == 'object') {
				base = bases[i] = makeFunction(base);
			} else if (typeof base != 'function') {
				throw new Error('Base class not a function for "' + className + '" [' + i + ']');
			}
			lin = base._meta ? base._meta.bases : [base];
			top = 0;
			// add bases to the name map
			for (j = lin.length - 1; j >= 0; --j) {
				proto = lin[j].prototype;
				proto.hasOwnProperty('declaredClass') || (proto.declaredClass = 'uniqName_' + (counter++));
				name = proto.declaredClass;
				if (!nameMap.hasOwnProperty(name)) {
					nameMap[name] = {count: 0, refs: [], cls: lin[j]};
					++clsCount;
				}
				rec = nameMap[name];
				if (top && top !== rec) {
					rec.refs.push(top);
					++top.count;
				}
				top = rec;
			}
			++top.count;
			roots[0].refs.push(top);
		}

		// remove classes without external references recursively
		while (roots.length) {
			top = roots.pop();
			result.push(top.cls);
			--clsCount;
			// optimization: follow a single-linked chain
			while (refs = top.refs, refs.length == 1) {
				top = refs[0];
				if (!top || --top.count) {
					// branch or end of chain => do not end to roots
					top = 0;
					break;
				}
				result.push(top.cls);
				--clsCount;
			}
			if (top) {
				// branch
				for (i = 0, l = refs.length; i < l; ++i) {
					top = refs[i];
					--top.count || roots.push(top);
				}
			}
		}

		if (clsCount) {
			throw new Error('Can\'t build consistent linearization for "' + className + '"');
		}

		// calculate the superclass offset
		base = bases[0];
		result[0] = base ?
			base._meta && base === result[result.length - base._meta.bases.length] ?
				base._meta.bases.length : 1 : 0;

		return result;
	}

var stats = [];

setTimeout(function () {
	var x = 0, min, max;
	stats.forEach(function (y) {
		x += y;
		if (!min || y < min) {
			min = y;
		}
		if (!max || y > max) {
			max = y;
		}
	});
	console.log(stats);
	console.log('total = ' + x);
	console.log('max = ' + max);
	console.log('min = ' + min);
	console.log('avg = ' + (x / stats.length));
}, 15000);

	function makeConstructor(bases) {
		return function() {
			var start = +new Date,
				a = arguments,
				a0 = a[0],
				f, m,
				i = bases.length,
				dc = this.declaredClass;

			if (dc) {
				classCounters[dc] || (classCounters[dc] = 0);
				this.widgetId = dc + ':' + (classCounters[dc]++);
			}

			// call all non-trivial constructors using prepared arguments
			while (i) {
				f = bases[--i];
				m = f._meta;
				if (m) {
					f = m.ctor;
					lang.mixProps(this, m.hidden);
				}
				typeof f == 'function' && f.apply(this, a);
			}

			// mixin args if any
			if (typeof a0 == 'object') {
				f = this.constants;
				for (i in a0) {
					a0.hasOwnProperty(i) && ((f && i in f ? f.__values__ : this)[i] = a0[i]);
				}
			}

			// add the toString() function for all our objects
			this.toString === objProto.toString && (this.toString = function() {
				return '[object ' + (dc ? dc.replace(/\./g, '') : 'Object') + ']';
			});

			// continue the original ritual: call the postscript
			f = this.postscript;
			f && f.apply(this, a);

			stats.push(+new Date - start);
		};
	}

	function makeFunction(obj) {
		var fn = new Function;
		mix(fn.prototype, obj);
		fn._meta = {
			bases: [fn],
			hidden: obj
		};
		return fn;
	}

	function mixClass(dest, src) {
		for (var p in src) {
			src.hasOwnProperty(p) && !specialPropsRegExp.test(p) && (dest[p] = src[p]);
		}
		return dest;
	}

	function declare2(className, superclass, definition) {
		if (typeof className != 'string') {
			definition = superclass;
			superclass = className;
			className = '';
		}
		definition = definition || {};

debugger;

		var bases = [],
			proto = {},
			ctors = [],
			ctor = new Function,
			i;

		if (Array.isArray(superclass)) {
			//bases = c3mro(superclass, className);
			//superclass = bases[mixins = bases.length - bases[0]];
		} else if (typeof superclass == 'function') {
			lang.mixProps(proto, superclass, 1);
			lang.mixProps(proto, definition, 1);
			i = superclass.constructor;
			typeof i == 'function' && ctors.push(i);
		} else if (typeof superclass == 'object') {
			lang.mixProps(proto, superclass, 1);
		}

		i = definition.constructor;
		if (typeof i == 'function' && i != objProto.constructor) {
			ctors.shift(i);
			proto.constructor = i;
		}

		ctor.constructor = function () {
			var start = +new Date,
				a = arguments,
				a0 = a[0],
				i = ctors.length,
				f, m,
				dc = this.declaredClass;

			if (dc) {
				classCounters[dc] || (classCounters[dc] = 0);
				this.widgetId = dc + ':' + (classCounters[dc]++);
			}
/*
			// call all non-trivial constructors using prepared arguments
			while (i) {
				f = ctors[--i];
				m = f._meta;
				if (m) {
					f = m.ctor;
				}
				typeof f == 'function' && f.apply(this, a);
			}

			// mixin args if any
			if (typeof a0 == 'object') {
				f = this.constants;
				for (i in a0) {
					a0.hasOwnProperty(i) && ((f && i in f ? f.__values__ : this)[i] = a0[i]);
				}
			}
*/
			// add the toString() function for all our objects
			this.toString === objProto.toString && (this.toString = function() {
				return '[object ' + (dc ? dc.replace(/\./g, '') : 'Object') + ']';
			});

			// continue the original ritual: call the postscript
			f = this.postscript;
			f && f.apply(this, a);

			stats.push(+new Date - start);
		};

		ctor.prototype = proto;

		className && lang.setObject(proto.declaredClass = className, ctor);

		return ctor;
	}

	function declare(className, superclass, definition) {
		// summary:
		//		Creates an instantiable class object.
		//
		// className: String?
		//		Optional. The name of the class.
		//
		// superclass: null | Object | Array
		//		The base class or classes to extend.
		//
		// definition: Object
		//		The definition of the class.

		if (typeof className != 'string') {
			definition = superclass;
			superclass = className;
			className = '';
		}
		definition = definition || {};

		var bases = [definition.constructor],
			ctor,
			i,
			mixins = 1,
			proto = {},
			t;

		// build the array of bases
		if (Array.isArray(superclass)) {
			bases = c3mro(superclass, className);
			superclass = bases[mixins = bases.length - bases[0]];
		} else if (typeof superclass == 'function') {
			t = superclass._meta;
			bases = bases.concat(t ? t.bases : superclass);
		} else if (typeof superclass == 'object') {
			superclass = makeFunction(superclass);
		} else {
			superclass = 0;
		}

		// build the prototype chain
		if (superclass) {
			for (i = mixins - 1;; --i) {
				ctor = new Function;
				ctor.prototype = superclass.prototype;
				proto = new ctor;

				// stop if nothing to add (the last base)
				if (!i) {
					break;
				}

				// mix in properties
				t = bases[i];
				(t._meta ? mixClass : mix)(proto, t.prototype);

				// chain in new constructor
				ctor = new Function;
				ctor.superclass = superclass;
				ctor.prototype = proto;
				superclass = proto.constructor = ctor;
			}
		}

		// add all properties except constructor, properties, constants, and __values__
		mixClass(proto, definition);

		// if the definition is not an object, then we want to use its constructor
		t = definition.constructor;
		t != objProto.constructor && (proto.constructor = t);

		// build the constructor and add meta information to the constructor
		proto.constructor = bases[0] = ctor = mix(makeConstructor(bases), {
			_meta: {
				bases: bases,
				hidden: definition,
				ctor: definition.constructor
			},
			superclass: superclass && superclass.prototype,
			prototype: proto
		});

		// add name if specified
		if (className) {
			proto.declaredClass = className;
			lang.setObject(className, ctor);
		}

		return ctor;
	}

	return _.declare = declare;
});