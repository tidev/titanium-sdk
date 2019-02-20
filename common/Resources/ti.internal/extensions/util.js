'use strict';

const util = {
	// So node actually calls into native code for these checks, but I think for shim compatability this is good enough
	// There's overhead for doing the native checks, and it'd require a native module to achieve.
	types: {
		// TODO: We're missing a lot of the methods hanging off this namespace!
		isNumberObject: value => {
			return typeof value === 'object' && Object.prototype.toString.call(value) === '[object Number]';
		},
		isStringObject: value => {
			return typeof value === 'object' && Object.prototype.toString.call(value) === '[object String]';
		},
		isBooleanObject: value => {
			return typeof value === 'object' && Object.prototype.toString.call(value) === '[object Boolean]';
		},
		// isBigIntObject: value => {
		// 	return Object.prototype.toString.call(value) === '[object BigInt]';
		// },
		isSymbolObject: value => {
			return typeof value === 'object' && Object.prototype.toString.call(value) === '[object Symbol]';
		},
		isBoxedPrimitive: function (value) {
			if (typeof value !== 'object') {
				return false;
			}
			return this.isNumberObject(value)
				|| this.isStringObject(value)
				|| this.isBooleanObject(value)
				// || this.isBigIntObject(value)
				|| this.isSymbolObject(value);
		},
		isNativeError: value => {
			// if not an instance of an Error, definietly not a native error
			if (!(value instanceof Error)) {
				return false;
			}
			if (!value || !value.constructor) {
				return false;
			}
			return [ 'Error', 'EvalError', 'RangeError', 'ReferenceError', 'SyntaxError', 'TypeError', 'URIError'].includes(value.constructor.name);

		},
		isSet: value => value instanceof Set,
		isMap: value => value instanceof Map,
		isDate: value => value instanceof Date,
		isRegexp: value => value instanceof RegExp || Object.prototype.toString.call(value) === '[object RegExp]'
	},
	isArray: value => Array.isArray(value),
	isBoolean: value => typeof value === 'boolean',
	isFunction: value => typeof value === 'function',
	isNull: value => value === null,
	isNullOrUndefined: value => value === undefined || value === null,
	isNumber: value => typeof value === 'number',
	isObject: value => value !== null && typeof value === 'object',
	isPrimitive: value => (typeof value !== 'object' && typeof value !== 'function') || value === null,
	isString: value => typeof value === 'string',
	isSymbol: value => typeof value === 'symbol',
	isUndefindex: value => value === undefined
};

util.isBuffer = () => false; // FIXME: Check for Ti.Buffer? for node/browserify buffer?
util.isDate = value => util.types.isDate(value);
util.isError = value => util.types.isNativeError(value); // FIXME: Implement util.types.isNativeError()!
util.isRegexp = value => util.types.isRegexp(value);

// FIXME: Our String.format is not very forgiving. It sort-of is supposed to do the same thing, but blows up easily
// util.format = String.format;
function getConstructor(obj) {
	if (obj.constructor) {
		return obj.constructor.name;
	}
	return 'Object';
}

const defaultInspectOptions = {
	showHidden: false,
	depth: 2,
	colors: false,
	customInspect: true,
	showProxy: false,
	maxArrayLength: 100,
	breakLength: 60,
	compact: true,
	sorted: false,
	getters: false
};
util.inspect = (obj, options = {}) => {
	const mergedOptions = Object.assign({}, defaultInspectOptions, options);
	// increase our recursion counter to avoid going past depth
	if (mergedOptions.recursionCount === undefined) {
		mergedOptions.recursionCount = -1;
	}
	mergedOptions.recursionCount++;
	console.log(`max depth: ${mergedOptions.depth}, current depth: ${mergedOptions.recursionCount}`);
	console.log(`show hidden? ${mergedOptions.showHidden}`);
	const objType = typeof obj;
	if (objType === 'object' || objType === 'function') {
		if (obj === null) {
			return 'null';
		}

		// Guard against circular references
		// FIXME: Need to push/pop the references, not store forever!
		mergedOptions.memo = mergedOptions.memo || [];
		if (mergedOptions.memo.includes(obj)) {
			return '[Circular]';
		}
		mergedOptions.memo.push(obj);

		const constructorName = getConstructor(obj);
		// if the constructor name is not 'Object', pre-pend it!
		let prefix = '';
		if (constructorName !== 'Object') {
			prefix = `${constructorName} `;
		}
		// now grab the type tag if it has one!
		const tag = obj[Symbol.toStringTag];
		if (tag && tag !== constructorName) {
			prefix = `${prefix}[${tag}] `;
		}

		// what braces do we use to enclose the values/properties?
		let open = '{';
		let close = '}';
		let header = ''; // for special cases like Function where we pre-pend header info
		const values = []; // collect the values/properties we list!
		const isArray = Array.isArray(obj);
		if (isArray) {
			if (prefix === 'Array ') {
				prefix = ''; // wipe "normal" Array prefixes
			}
			[ open, close ] = [ '[', ']' ]; // use array braces
			if (obj.length > 0) {
				// TODO: handle sparse arrays
				values.push(...obj.map(o => util.inspect(o, mergedOptions)));
			}
		} else if (util.types.isMap(obj)) {
			if (obj.size > 0) {
				values.push(...Array.from(obj).map(entry => `${util.inspect(entry[0], mergedOptions)} => ${util.inspect(entry[1], mergedOptions)}`));
			}
		} else if (util.types.isSet(obj)) {
			if (obj.size > 0) {
				values.push(...Array.from(obj).map(o => util.inspect(o, mergedOptions)));
			}
		} else if (util.types.isRegexp(obj)) {
			// don't do prefix or any of that crap! TODO: Can we just call Regexp.prototype.toString.call()?
			return `/${obj.source}/${obj.flags}`;
		} else if (util.isFunction(obj)) {
			if (prefix === 'Function ') {
				prefix = ''; // wipe "normal" Function prefixes
			}

			// Functions are special and we must use a "header"
			// if no values/properties, just print the "header"
			// if any, stick "header" inside braces before property/value listing
			if (obj.name) {
				header = `[Function: ${obj.name}]`;
			} else {
				header = '[Function]';
			}
		}

		// If we've gone past our depth, just do a quickie result here, like '[Object]'
		if (mergedOptions.recursionCount > mergedOptions.depth) {
			return `[${constructorName || tag || 'Object'}]`;
		}

		// handle properties
		const properties = [];
		// if showing hidden, get all own properties, otherwise just enumerable
		const ownProperties = (mergedOptions.showHidden) ? Object.getOwnPropertyNames(obj) : Object.keys(obj);
		console.log(`Properties to list: ${ownProperties}`);
		for (const propName of ownProperties) {
			if (isArray && propName.match(/^\d+$/)) { // skip Array's index properties
				continue;
			}
			const propDesc = Object.getOwnPropertyDescriptor(obj, propName)
				|| { value: obj[propName], enumerable: true }; // fall back to faking a descriptor
			if (propDesc.value !== undefined) {
				if (propDesc.enumerable) {
					properties.push(`${propName}: ${util.inspect(propDesc.value, mergedOptions)}`);
				} else { // If not enumerable, wrap name in []!
					properties.push(`[${propName}]: ${util.inspect(propDesc.value, mergedOptions)}`);
				}
			}
			// TODO: Handle setter/getters
		}
		if (properties.length !== 0) {
			values.push(...properties);
		}

		let value = '';
		if (values.length === 0) {
			if (header.length > 0) {
				value = header; // i.e. '[Function: name]'
			} else {
				value = `${open}${close}`; // no spaces, i.e. '{}' or '[]'
			}
		} else if (header.length > 0) { // i.e. '{ [Function] a: 1, b: 2 }'
			value = `${open} ${header} ${values.join(', ')} ${close}`; // spaces between braces and values/properties
		} else {  // i.e. '{ 1, 2, a: 3 }'
			value = `${open} ${values.join(', ')} ${close}`; // spaces between braces and values/properties
		}

		return `${prefix}${value}`;
	}
	// only special case is -0
	if (objType === 'string') {
		return `'${obj}'`;
	} else if (objType === 'number' && Object.is(obj, -0)) { // can't check for -0 using ===
		return '-0';
	} else if (util.isSymbol(obj)) {
		return obj.toString();
	}
	// TODO: Handle BigInt?
	return `${obj}`;
};

/**
 * Retruns result of `JSON.stringify()` if possible, falling back to `'[Circular]'` if that throws.
 * @param {*} value The value/object to stringify
 * @returns {string}
 */
function stringify(value) {
	try {
		return JSON.stringify(value);
	} catch (e) {
		if (e instanceof TypeError
			&& (e.message.includes('circular') || e.message.includes('cyclic'))) {
			// "Converting circular structure to JSON"
			// JSC gives: "JSON.stringify cannot serialize cyclic structures."
			// TODO: Maybe force a circular reference object through and sniff the JS engine's message generated to match against?
			return '[Circular]';
		}
		throw e;
	}
}

util.format = (...args) => {
	const firstArg = args[0];
	if (typeof firstArg === 'string') {
		// normal usage!
		if (args.length === 1) {
			return firstArg;
		}

		// TODO: ok, we really do have to look at the string to find the % specifiers
		// Do we loop over the args.length and find next index of '%', match what type it is and replace?
		let lastIndex = 0;
		let str = '';
		let i = 1; // start at second argument
		for (i; i < args.length;) {
			const curArg = args[i];
			const foundIndex = firstArg.indexOf('%', lastIndex);
			if (foundIndex === -1) {
				// No more placeholders left, so break and at bottom we'll append rest of string
				break;
			}
			// grab segment of string and append to str
			str += firstArg.slice(lastIndex, foundIndex);
			// now look at next char to see how to replace
			const nextChar = firstArg.charAt(foundIndex + 1);
			switch (nextChar) {
				case 's': // string
					str += String(curArg);
					i++; // consume argument
					break;

				case 'd': // Number
					if (util.isSymbol(curArg) || util.types.isSymbolObject(curArg)) {
						str += 'NaN';
					} else {
						str += Number(curArg);
					}
					i++; // consume argument
					break;

				case 'i': // Integer
					if (util.isSymbol(curArg) || util.types.isSymbolObject(curArg)) {
						str += 'NaN';
					} else {
						str += parseInt(curArg);
					}
					i++; // consume argument
					break;

				case 'f': // Float
					if (util.isSymbol(curArg) || util.types.isSymbolObject(curArg)) {
						str += 'NaN';
					} else {
						str += parseFloat(curArg);
					}
					i++; // consume argument
					break;

				case 'j':  // JSON
					str += stringify(curArg);
					i++; // consume argument
					break;

				case 'o': // Object w/showHidden and showProxy
					str += util.inspect(curArg, { showHidden: true, showProxy: true });
					i++; // consume argument
					break;

				case 'O': // Object w/o options
					str += util.inspect(curArg);
					i++; // consume argument
					break;

				case '%': // escaped %
					str += '%';
					// Don't consume argument here!
					break;
			}
			lastIndex = foundIndex + 2;
		}

		// If we haven't reached end of string, append rest of it with no replacements!
		str += firstArg.slice(lastIndex, firstArg.length);

		// If we have args remaining, need to...
		// loop over rest of args and coerce to Strings and concat joined by spaces.
		// FIXME: Unless typeof === 'object' or 'symbol', then do util.inspect() on them
		if (i < args.length) {
			str += ` ${args.slice(i).map(a => String(a)).join(' ')}`;
		}
		return str;
	}

	// first arg wasn't string, so we loop over args and call util.inspect on each
	return args.map(a => util.inspect(a)).join(' ');
};

module.exports = util;
