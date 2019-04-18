import assertArgumentType from './_errors';

const MONTHS = [
	'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

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
			// if not an instance of an Error, definitely not a native error
			if (!(value instanceof Error)) {
				return false;
			}
			if (!value || !value.constructor) {
				return false;
			}
			return [ 'Error', 'EvalError', 'RangeError', 'ReferenceError', 'SyntaxError', 'TypeError', 'URIError' ].includes(value.constructor.name);

		},
		isPromise: value => {
			const valueType = typeof value;
			return (valueType === 'object' || valueType === 'function') && value.then && typeof value.then === 'function';
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
	isUndefined: value => value === undefined,
	log: string => {
		const date = new Date();
		const time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
		// Produces output like: "21 Feb 10:04:23 - message"
		console.log(`${date.getDate()} ${MONTHS[date.getMonth()]} ${time} - ${string}`);
	},
	print: (...args) => console.log(args.join('')), // FIXME: Shouldn't add trailing newline like console.log does!
	puts: (...args) => console.log(args.join('\n')),
	error: (...args) => console.error(args.join('\n')),
	debug: string => console.error(`DEBUG: ${string}`)
};

util.isBuffer = () => false; // FIXME: Check for Ti.Buffer? for node/browserify buffer?
util.isDate = value => util.types.isDate(value);
util.isError = value => util.types.isNativeError(value);
util.isRegexp = value => util.types.isRegexp(value);

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

function formatArray(array, options) {
	const maxLength = Math.max(0, options.maxArrayLength);
	const arrayLength = array.length;
	const values = [];
	let consecutiveEmpties = 0;
	let i = 0;
	// for sparse arrays, consecutive empties count as a "single item" in terms of maxArrayLength
	for (; i < arrayLength; i++) { // don't go past end of array...
		const value = array[i];
		if (value === undefined) { // sparse array!
			consecutiveEmpties++;
			continue;
		}

		// non-empty index currently...
		if (consecutiveEmpties > 0) { // were we collecting consecutive empty indices as a single gap?
			values.push(`<${consecutiveEmpties} empty item${consecutiveEmpties > 1 ? 's' : ''}>`);
			consecutiveEmpties = 0; // reset our count
			if (values.length >= maxLength) { // don't show more than options.maxArrayLength "values"
				break;
			}
		}
		// push the current index value
		values.push(util.inspect(value, options));
		if (values.length >= maxLength) { // don't show more than options.maxArrayLength "values"
			i++; // so our "remaining" count is correct
			break;
		}
	}

	const remaining = arrayLength - i;
	if (remaining > 0) { // did we stop before the end of the array (due to options.maxArrayLength)?
		values.push(`... ${remaining} more item${remaining > 1 ? 's' : ''}`);
	} else if (consecutiveEmpties > 0) { // did the sparse array gaps run to the end of the array?
		values.push(`<${consecutiveEmpties} empty item${consecutiveEmpties > 1 ? 's' : ''}>`);
	}

	return values;
}

/**
 * @param {*} obj JS value or object to inspect
 * @param {object} [options] options for output
 * @param {Integer} [options.breakLength=60] length at which to break properties into individual lines
 * @param {boolean} [options.showHidden=false] whether to include hidden properties (non-enumerable)
 * @param {boolean} [options.sorted=false] whether to sort the property listings per-object
 * @param {boolean} [options.compact=true] if set to `false`, uses luxurious amount of spacing and newlines
 * @param {Integer} [options.depth=2] depth to recurse into objects
 * @returns {string}
 */
util.inspect = (obj, options = {}) => {
	const mergedOptions = Object.assign({}, defaultInspectOptions, options);
	// increase our recursion counter to avoid going past depth
	if (mergedOptions.recursionCount === undefined) {
		mergedOptions.recursionCount = -1;
	}
	mergedOptions.recursionCount++;
	if (mergedOptions.indentLevel === undefined) {
		mergedOptions.indentLevel = 0;
	}
	try {
		const objType = typeof obj;
		if (objType === 'object' || objType === 'function') {
			if (obj === null) {
				return 'null';
			}

			// Guard against circular references
			mergedOptions.memo = mergedOptions.memo || [];
			if (mergedOptions.memo.includes(obj)) {
				return '[Circular]';
			}
			try {
				mergedOptions.memo.push(obj); // popped off in a finally block, so we only worry about circular references, not sibling references

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
					values.push(...formatArray(obj, mergedOptions));
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
					return header || `[${constructorName || tag || 'Object'}]`;
				}

				// handle properties
				const properties = [];
				// if showing hidden, get all own properties, otherwise just enumerable
				const ownProperties = (mergedOptions.showHidden) ? Object.getOwnPropertyNames(obj) : Object.keys(obj);
				// FIXME: On V8/Android we are not getting 'arguments' and 'caller' properties!
				// This may be because in newer specs/strict mode they shouldn't be accessible?
				for (const propName of ownProperties) {
					if (isArray && propName.match(/^\d+$/)) { // skip Array's index properties
						continue;
					}
					const propDesc = Object.getOwnPropertyDescriptor(obj, propName)
						|| { value: obj[propName], enumerable: true }; // fall back to faking a descriptor
					const key = propDesc.enumerable ? propName : `[${propName}]`; // If not enumerable, wrap name in []!
					if (propDesc.value !== undefined) {
						mergedOptions.indentLevel += 3; // Node uses 3 spaces for arrays/Objects?
						let space = ' ';
						const value = util.inspect(propDesc.value, mergedOptions);
						// if value is breaking, break between key and top-level value
						if (value.length > mergedOptions.breakLength) {
							space = `\n${' '.repeat(mergedOptions.indentLevel)}`;
						}
						mergedOptions.indentLevel -= 3;
						properties.push(`${key}:${space}${value}`);
					} else if (propDesc.get !== undefined) {
						// TODO: Handle when options.getters === true, need to actually attempt to get and show value!
						if (propDesc.set !== undefined) {
							properties.push(`${key}: [Getter/Setter]`);
						} else {
							properties.push(`${key}: [Getter]`);
						}
					} else if (propDesc.set !== undefined) {
						properties.push(`${key}: [Setter]`);
					} else { // weird case of a property defined with an explicit undefined value
						properties.push(`${key}: undefined`);
					}
				}
				if (properties.length !== 0) {
					// TODO: Handle custom sorting option!
					if (mergedOptions.sorted) {
						properties.sort();
					}
					values.push(...properties);
				}

				let value = '';
				if (values.length === 0) {
					if (header.length > 0) {
						value = header; // i.e. '[Function: name]'
					} else {
						value = `${open}${close}`; // no spaces, i.e. '{}' or '[]'
					}
				} else {
					let str = '';
					if (header.length > 0) { // i.e. '{ [Function] a: 1, b: 2 }'
						str = `${header} `;
					}
					// Handle breaking them by breakLength here!
					let length = 0;
					for (const value of values) {
						length += value.length + 1; // Node seems to add one for comma, but not more for spaces?
						if (length > mergedOptions.breakLength) { // break early if length > breakLength!
							break;
						}
					}
					if (length > mergedOptions.breakLength) {
						const indent = ' '.repeat(mergedOptions.indentLevel);
						// break them up!
						str += values.join(`,\n${indent}  `);
					} else {
						str += values.join(', ');
					}

					value = `${open} ${str} ${close}`; // spaces between braces and values/properties
				}

				return `${prefix}${value}`;
			} finally {
				mergedOptions.memo.pop(obj);
			}
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
	} finally {
		mergedOptions.recursionCount--;
	}
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
					str += util.inspect(curArg, { showHidden: true, showProxy: true, depth: 4 });
					i++; // consume argument
					break;

				case 'O': // Object w/o options
					str += util.inspect(curArg, {});
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
		// Unless typeof === 'object' or 'symbol', then do util.inspect() on them
		if (i < args.length) {
			str += ` ${args.slice(i).map(a => {
				const aType = typeof a;
				switch (aType) {
					case 'object':
					case 'symbol':
						return util.inspect(a);
					default:
						return String(a);
				}
			}).join(' ')}`;
		}
		return str;
	}

	// first arg wasn't string, so we loop over args and call util.inspect on each
	return args.map(a => util.inspect(a)).join(' ');
};

/**
 * @param {Function} constructor subclass
 * @param {Function} superConstructor base class
 * @returns {void}
 */
util.inherits = function (constructor, superConstructor) {
	assertArgumentType(constructor, 'constructor', 'Function');
	assertArgumentType(superConstructor, 'superConstructor', 'Function');
	assertArgumentType(superConstructor.prototype, 'superConstructor.prototype', 'Object');

	Object.defineProperty(constructor, 'super_', { value: superConstructor });
	Object.setPrototypeOf(constructor.prototype, superConstructor.prototype);
};

/**
 * @param {Function} original original function to wrap which is expected to have a final callback argument
 * @returns {Function} function that returns a Promise
 */
util.promisify = function (original) {
	assertArgumentType(original, 'original', 'Function');

	function wrapped(...args) {
		return new Promise((resolve, reject) => {
			original.call(this, ...args, (err, result) => {
				if (err) {
					return reject(err);
				}

				return resolve(result);
			});
		});
	}
	// TODO: Copy properties from original to wrapped
	// TODO: hook prototype chain up from wrapped to original
	// TODO: Support custom promisify hooks
	return wrapped;
};

/**
 * @param {Function} original original function to convert from async/Promise return value to a callback style
 * @returns {Function} wrapped function
 */
util.callbackify = function (original) {
	assertArgumentType(original, 'original', 'Function');

	function wrapped(...args) {
		const callback = args.pop();
		const promise = original.apply(this, args);
		promise
			.then(result => { // eslint-disable-line promise/always-return
				callback(null, result); // eslint-disable-line promise/no-callback-in-promise
			})
			.catch(err => {
				if (!err) {
					const wrappedError = new Error('Promise was rejected with falsy value');
					wrappedError.reason = err;
					err = wrappedError;
				}
				callback(err);  // eslint-disable-line promise/no-callback-in-promise
			});
	}
	return wrapped;
};

/**
 * @param {Function} func function to deprecate/wrap
 * @param {string} string message to give when deprecation warning is emitted
 * @param {string} code deprecation code to use to group warnings
 * @returns {Function} wrapped function
 */
util.deprecate = function (func, string, code) { // eslint-disable-line no-unused-vars
	if (process.noDeprecation) {
		return func; // skip the wrapping!
	}
	// TODO: Support `code` argument by tracking a map of codes we've warned about
	function wrapped(...args) {
		let warned = false;
		if (!warned) {
			process.emitWarning(string, 'DeprecationWarning');
			warned = true;
		}
		return func.apply(this, args);
	}

	return wrapped;
};
// TODO: Support debuglog? What is our equivalent of process.env('NODE_DEBUG')?
const noop = () => {};
util.debuglog = () => {
	return noop;
};

export default util;
