/**
 * declare() functionality based on code from Dojo Toolkit.
 *
 * Dojo Toolkit
 * Copyright (c) 2005-2011, The Dojo Foundation
 * New BSD License
 * <http://dojotoolkit.org>
 */

define(["Ti/_", "Ti/_/lang"], function(_, lang) {
	var is = require.is,
		mix = require.mix,
		counter = 0,
		classCounters = {},
		objProto = Object.prototype;

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
			} else if (is(base, "Object")) {
				base = bases[i] = makeFunction(base);
			} else if (!is(base, "Function")) {
				throw new Error('Base class not a function for "' + className + '" [' + i + ']');
			}
			lin = base._meta ? base._meta.bases : [base];
			top = 0;
			// add bases to the name map
			for (j = lin.length - 1; j >= 0; --j) {
				proto = lin[j].prototype;
				proto.hasOwnProperty("declaredClass") || (proto.declaredClass = "uniqName_" + (counter++));
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

	function makeConstructor(bases, ctorSpecial) {
		return function() {
			var a = arguments,
				args = a,
				a0 = a[0],
				f, i, m, p,
				l = bases.length,
				preArgs,
				dc = this.declaredClass;

			classCounters[dc] || (classCounters[dc] = 0);
			this.widgetId = dc + ":" + (classCounters[dc]++);

			// 1) call two types of the preamble
			if (ctorSpecial && (a0 && a0.preamble || this.preamble)) {
				// full blown ritual
				preArgs = new Array(bases.length);
				// prepare parameters
				preArgs[0] = a;
				for (i = 0;;) {
					// process the preamble of the 1st argument
					(a0 = a[0]) && (f = a0.preamble) && (a = f.apply(this, a) || a);
					// process the preamble of this class
					f = bases[i].prototype;
					f = f.hasOwnProperty("preamble") && f.preamble;
					f && (a = f.apply(this, a) || a);
					if (++i === l) {
						break;
					}
					preArgs[i] = a;
				}
			}

			// 2) call all non-trivial constructors using prepared arguments
			for (i = l - 1; i >= 0; --i) {
				f = bases[i];
				m = f._meta;
				if (m) {
					f = m.ctor;
					lang.mixProps(this, m.hidden);
				}
				is(f, "Function") && f.apply(this, preArgs ? preArgs[i] : a);
			}

			// 3) mixin args if any
			if (is(a0, "Object")) {
				f = this.constants;
				for (i in a0) {
					a0.hasOwnProperty(i) && ((f && i in f ? f.__values__ : this)[i] = a0[i]);
				}
			}

			// add the toString() function for all our objects
			this.toString === objProto.toString && (this.toString = function() {
				return "[object " + dc.replace(/\./g, '') + "]";
			});

			// 4) continue the original ritual: call the postscript
			f = this.postscript;
			f && f.apply(this, args);
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
			if (src.hasOwnProperty(p) && !/^(constructor|properties|constants|__values__)$/.test(p)) {
				is(src[p], "Function") && (src[p].nom = name);
				dest[p] = src[p];
			}
		}
		return dest;
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

		if (!is(className, "String")) {
			definition = superclass;
			superclass = className;
			className = "";
		}
		definition = definition || {};

		var bases = [definition.constructor],
			ctor,
			i,
			mixins = 1,
			proto = {},
			superclassType = is(superclass),
			t;

		// build the array of bases
		if (superclassType === "Array") {
			bases = c3mro(superclass, className);
			superclass = bases[mixins = bases.length - bases[0]];
		} else if (superclassType === "Function") {
			t = superclass._meta;
			bases = bases.concat(t ? t.bases : superclass);
		} else if (superclassType === "Object") {
			bases[1] = superclass = makeFunction(superclass);
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

		// add all properties except constructor, properties, and constants
		mixClass(proto, definition);

		// if the definition is not an object, then we want to use its constructor
		t = definition.constructor;
		if (t !== objProto.constructor) {
			t.nom = "constructor";
			proto.constructor = t;
		}

		// build the constructor and add meta information to the constructor
		mix(bases[0] = ctor = makeConstructor(bases, t), {
			_meta: {
				bases: bases,
				hidden: definition,
				ctor: definition.constructor
			},
			superclass: superclass && superclass.prototype,
			extend: function(src) {
				mixClass(this.prototype, src);
				return this;
			},
			prototype: proto
		});

		// add "standard" methods to the prototype
		mix(proto, {
			constructor: ctor,
			isInstanceOf: function(cls) {
				var bases = this.constructor._meta.bases,
					i = 0,
					l = bases.length;
				for (; i < l; ++i) {
					if (bases[i] === cls) {
						return true;
					}
				}
				return this instanceof cls;
			}
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