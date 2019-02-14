'use strict';

const util = {
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

util.inspect = (obj) => {
	const objType = typeof obj;
	if (objType === 'object' || objType === 'function') {
		if (obj === null) {
			return 'null';
		}

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
		let value = '{}';
		// TODO, ok now actually loop through properties/values/etc
		// FIXME: Handle the 0 length/size Array/Set/Map more gracefully!
		if (Array.isArray(obj)) {
			if (prefix === 'Array ') {
				prefix = ''; // wipe "normal" Array prefixes
			}
			if (obj.length > 0) {
				// TODO: handle non-index properties, sparse arrays
				value = `[ ${obj.map(o => util.inspect(o)).join(', ')} ]`;
			} else {
				value = '[]'; // empty array needs to extra spaces
			}
		} else if (util.types.isMap(obj)) {
			if (obj.size > 0) {
				value = `{ ${Array.from(obj).map(entry => `${util.inspect(entry[0])} => ${util.inspect(entry[1])}`).join(', ')} }`;
			} else {
				value = '{}';
			}
		} else if (util.types.isSet(obj)) {
			if (obj.size > 0) {
				value = `{ ${Array.from(obj).map(o => util.inspect(o)).join(', ')} }`;
			} else {
				value = '{}';
			}
		} else if (util.types.isRegexp(obj)) {
			// don't do prefix or any of that crap!
			return `/${obj.source}/${obj.flags}`;
		}
		// TODO: handle objects, Maps, Sets, Arrays, Functions
		return `${prefix}${value}`;
	}
	// only special case is -0
	if (objType === 'string') {
		return `'${obj}'`;
	} else if (objType === 'number' && Object.is(obj, -0)) { // can't check for -0 using ===
		return '-0';
	}
	// TODO: Handle BigInt and Symbols!
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
