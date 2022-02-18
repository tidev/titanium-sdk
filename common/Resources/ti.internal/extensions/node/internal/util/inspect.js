// Copyright Node.js contributors. All rights reserved.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// IN THE SOFTWARE.

/**
 * Node's lib/internal/util/inspec.js modified for Axway Titanium
 *
 * @see https://github.com/nodejs/node/blob/master/lib/internal/util/inspect.js
 */

import {
	isAsyncFunction,
	isGeneratorFunction,
	isAnyArrayBuffer,
	isArrayBuffer,
	isArgumentsObject,
	isBoxedPrimitive,
	isDataView,
	isMap,
	isMapIterator,
	isPromise,
	isSet,
	isSetIterator,
	isWeakMap,
	isWeakSet,
	isRegExp,
	isDate,
	isTypedArray,
	isStringObject,
	isNumberObject,
	isBooleanObject,
	isUint8Array,
	isUint8ClampedArray,
	isUint16Array,
	isUint32Array,
	isInt8Array,
	isInt16Array,
	isInt32Array,
	isFloat32Array,
	isFloat64Array
} from './types';
import { codes, isStackOverflowError } from '../errors';
import {
	customInspectSymbol,
	getOwnNonIndexProperties,
	isError,
	join,
	propertyFilter,
	removeColors,
	uncurryThis
} from '../util';

const { ALL_PROPERTIES, ONLY_ENUMERABLE } = propertyFilter;

const BooleanPrototype = Boolean.prototype;
const DatePrototype = Date.prototype;
const ErrorPrototype = Error.prototype;
const NumberPrototype = Number.prototype;
const MapPrototype = Map.prototype;
const RegExpPrototype = RegExp.prototype;
const StringPrototype = String.prototype;
const SetPrototype = Set.prototype;
const SymbolPrototype = Symbol.prototype;

const isIos =  [ 'ipad', 'iphone' ].includes(Ti.Platform.osname);

const { ERR_INVALID_ARG_TYPE } = codes;

const hasOwnProperty = uncurryThis(Object.prototype.hasOwnProperty);
const propertyIsEnumerable = uncurryThis(Object.prototype.propertyIsEnumerable);

import Buffer from '../../buffer';
let hexSlice = uncurryThis(Buffer.Buffer.prototype.hexSlice);

const builtInObjects = new Set(
	Object.getOwnPropertyNames(global).filter((e) => /^([A-Z][a-z]+)+$/.test(e))
);

export const inspectDefaultOptions = Object.seal({
	showHidden: false,
	depth: 2,
	colors: false,
	customInspect: true,
	showProxy: false,
	maxArrayLength: 100,
	breakLength: 80,
	compact: 3,
	sorted: false,
	getters: false
});

const kObjectType = 0;
const kArrayType = 1;
const kArrayExtrasType = 2;

/* eslint-disable no-control-regex */
const strEscapeSequencesRegExp = /[\x00-\x1f\x27\x5c]/;
const strEscapeSequencesReplacer = /[\x00-\x1f\x27\x5c]/g;
const strEscapeSequencesRegExpSingle = /[\x00-\x1f\x5c]/;
const strEscapeSequencesReplacerSingle = /[\x00-\x1f\x5c]/g;
/* eslint-enable no-control-regex */

const keyStrRegExp = /^[a-zA-Z_][a-zA-Z_0-9]*$/;
const numberRegExp = /^(0|[1-9][0-9]*)$/;

const nodeModulesRegExp = /[/\\]node_modules[/\\](.+?)(?=[/\\])/g;

const kMinLineLength = 16;

// Constants to map the iterator state.
const kWeak = 0;
const kIterator = 1;
const kMapEntries = 2;

// Escaped special characters. Use empty strings to fill up unused entries.
/* eslint-disable quotes */
const meta = [
	'\\u0000', '\\u0001', '\\u0002', '\\u0003', '\\u0004',
	'\\u0005', '\\u0006', '\\u0007', '\\b', '\\t',
	'\\n', '\\u000b', '\\f', '\\r', '\\u000e',
	'\\u000f', '\\u0010', '\\u0011', '\\u0012', '\\u0013',
	'\\u0014', '\\u0015', '\\u0016', '\\u0017', '\\u0018',
	'\\u0019', '\\u001a', '\\u001b', '\\u001c', '\\u001d',
	'\\u001e', '\\u001f', '', '', '',
	'', '', '', '', "\\'", '', '', '', '', '',
	'', '', '', '', '', '', '', '', '', '',
	'', '', '', '', '', '', '', '', '', '',
	'', '', '', '', '', '', '', '', '', '',
	'', '', '', '', '', '', '', '', '', '',
	'', '', '', '', '', '', '', '\\\\'
];
/* eslint-enable quotes */

function getUserOptions(ctx) {
	const obj = { stylize: ctx.stylize };
	for (const key of Object.keys(inspectDefaultOptions)) {
		obj[key] = ctx[key];
	}
	if (ctx.userOptions === undefined) {
		return obj;
	}
	return { ...obj, ...ctx.userOptions };
}

/**
 * Echos the value of any input. Tries to print the value out
 * in the best way possible given the different types.
 *
 * @param {any} value The value to print out.
 * @param {Object} opts Optional options object that alters the output.
 * @return {string} The string representation of `value`
 */
export function inspect(value, opts) {
	// Default options
	const ctx = {
		budget: {},
		indentationLvl: 0,
		seen: [],
		currentDepth: 0,
		stylize: stylizeNoColor,
		showHidden: inspectDefaultOptions.showHidden,
		depth: inspectDefaultOptions.depth,
		colors: inspectDefaultOptions.colors,
		customInspect: inspectDefaultOptions.customInspect,
		showProxy: inspectDefaultOptions.showProxy,
		maxArrayLength: inspectDefaultOptions.maxArrayLength,
		breakLength: inspectDefaultOptions.breakLength,
		compact: inspectDefaultOptions.compact,
		sorted: inspectDefaultOptions.sorted,
		getters: inspectDefaultOptions.getters
	};
	if (arguments.length > 1) {
		// Legacy...
		if (arguments.length > 2) {
			if (arguments[2] !== undefined) {
				ctx.depth = arguments[2];
			}
			if (arguments.length > 3 && arguments[3] !== undefined) {
				ctx.colors = arguments[3];
			}
		}
		// Set user-specified options
		if (typeof opts === 'boolean') {
			ctx.showHidden = opts;
		} else if (opts) {
			const optKeys = Object.keys(opts);
			for (const key of optKeys) {
				// TODO(BridgeAR): Find a solution what to do about stylize. Either make
				// this function public or add a new API with a similar or better
				// functionality.
				if (hasOwnProperty(inspectDefaultOptions, key) || key === 'stylize') {
					ctx[key] = opts[key];
				} else if (ctx.userOptions === undefined) {
					// This is required to pass through the actual user input.
					ctx.userOptions = opts;
				}
			}
		}
	}
	if (ctx.colors) {
		ctx.stylize = stylizeWithColor;
	}
	if (ctx.maxArrayLength === null) {
		ctx.maxArrayLength = Infinity;
	}
	return formatValue(ctx, value, 0);
}
inspect.custom = customInspectSymbol;

Object.defineProperty(inspect, 'defaultOptions', {
	get() {
		return inspectDefaultOptions;
	},
	set(options) {
		if (options === null || typeof options !== 'object') {
			throw new ERR_INVALID_ARG_TYPE('options', 'Object', options);
		}
		Object.assign(inspectDefaultOptions, options);
	}
});

// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = Object.assign(Object.create(null), {
	bold: [ 1, 22 ],
	italic: [ 3, 23 ],
	underline: [ 4, 24 ],
	inverse: [ 7, 27 ],
	white: [ 37, 39 ],
	grey: [ 90, 39 ],
	black: [ 30, 39 ],
	blue: [ 34, 39 ],
	cyan: [ 36, 39 ],
	green: [ 32, 39 ],
	magenta: [ 35, 39 ],
	red: [ 31, 39 ],
	yellow: [ 33, 39 ]
});

// Don't use 'blue' not visible on cmd.exe
inspect.styles = Object.assign(Object.create(null), {
	special: 'cyan',
	number: 'yellow',
	bigint: 'yellow',
	boolean: 'yellow',
	undefined: 'grey',
	null: 'bold',
	string: 'green',
	symbol: 'green',
	date: 'magenta',
	// "name": intentionally not styling
	regexp: 'red',
	module: 'underline'
});

function addQuotes(str, quotes) {
	if (quotes === -1) {
		return `"${str}"`;
	}
	if (quotes === -2) {
		return `\`${str}\``;
	}
	return `'${str}'`;
}

const escapeFn = (str) => meta[str.charCodeAt(0)];

// Escape control characters, single quotes and the backslash.
// This is similar to JSON stringify escaping.
function strEscape(str) {
	let escapeTest = strEscapeSequencesRegExp;
	let escapeReplace = strEscapeSequencesReplacer;
	let singleQuote = 39;

	// Check for double quotes. If not present, do not escape single quotes and
	// instead wrap the text in double quotes. If double quotes exist, check for
	// backticks. If they do not exist, use those as fallback instead of the
	// double quotes.
	// eslint-disable-next-line quotes
	if (str.includes("'")) {
		// This invalidates the charCode and therefore can not be matched for
		// anymore.
		if (!str.includes('"')) {
			singleQuote = -1;
		} else if (!str.includes('`') && !str.includes('${')) {
			singleQuote = -2;
		}
		if (singleQuote !== 39) {
			escapeTest = strEscapeSequencesRegExpSingle;
			escapeReplace = strEscapeSequencesReplacerSingle;
		}
	}

	// Some magic numbers that worked out fine while benchmarking with v8 6.0
	if (str.length < 5000 && !escapeTest.test(str)) {
		return addQuotes(str, singleQuote);
	}
	if (str.length > 100) {
		str = str.replace(escapeReplace, escapeFn);
		return addQuotes(str, singleQuote);
	}

	let result = '';
	let last = 0;
	const lastIndex = str.length;
	for (let i = 0; i < lastIndex; i++) {
		const point = str.charCodeAt(i);
		if (point === singleQuote || point === 92 || point < 32) {
			if (last === i) {
				result += meta[point];
			} else {
				result += `${str.slice(last, i)}${meta[point]}`;
			}
			last = i + 1;
		}
	}

	if (last !== lastIndex) {
		result += str.slice(last);
	}
	return addQuotes(result, singleQuote);
}

function stylizeWithColor(str, styleType) {
	const style = inspect.styles[styleType];
	if (style !== undefined) {
		const color = inspect.colors[style];
		return `\u001b[${color[0]}m${str}\u001b[${color[1]}m`;
	}
	return str;
}

function stylizeNoColor(str) {
	return str;
}

// Return a new empty array to push in the results of the default formatter.
function getEmptyFormatArray() {
	return [];
}

function getConstructorName(obj, _ctx) {
	let firstProto;
	// const tmp = obj;
	while (obj) {
		const descriptor = Object.getOwnPropertyDescriptor(obj, 'constructor');
		if (descriptor !== undefined
				&& typeof descriptor.value === 'function'
				&& descriptor.value.name !== '') {
			return descriptor.value.name;
		}

		obj = Object.getPrototypeOf(obj);
		if (firstProto === undefined) {
			firstProto = obj;
		}
	}

	if (firstProto === null) {
		return null;
	}

	/*
	 @todo this calls into native, can we replace this somehow?
	return `${internalGetConstructorName(tmp)} <${inspect(firstProto, {
		...ctx,
		customInspect: false
	})}>`;
	*/

	return null;
}

function getPrefix(constructor, tag, fallback) {
	if (constructor === null) {
		if (tag !== '') {
			return `[${fallback}: null prototype] [${tag}] `;
		}
		return `[${fallback}: null prototype] `;
	}

	if (tag !== '' && constructor !== tag) {
		return `${constructor} [${tag}] `;
	}
	return `${constructor} `;
}

// Look up the keys of the object.
function getKeys(value, showHidden) {
	let keys;
	const symbols = Object.getOwnPropertySymbols(value);
	if (showHidden) {
		keys = Object.getOwnPropertyNames(value);
		if (symbols.length !== 0) {
			keys.push(...symbols);
		}
	} else {
		// This might throw if `value` is a Module Namespace Object from an
		// unevaluated module, but we don't want to perform the actual type
		// check because it's expensive.
		// TODO(devsnek): track https://github.com/tc39/ecma262/issues/1209
		// and modify this logic as needed.
		try {
			keys = Object.keys(value);
		} catch (err) {
			// @fixme how to du isModuleNamespaceObject?
			/*
			assert(isNativeError(err) && err.name === 'ReferenceError' &&
						 isModuleNamespaceObject(value));
			*/
			keys = Object.getOwnPropertyNames(value);
		}
		if (symbols.length !== 0) {
			keys.push(...symbols.filter((key) => propertyIsEnumerable(value, key)));
		}
	}
	return keys;
}

function getCtxStyle(value, constructor, tag) {
	let fallback = '';
	if (constructor === null) {
		fallback = 'Object';
	}
	return getPrefix(constructor, tag, fallback);
}

function findTypedConstructor(value) {
	for (const [ check, clazz ] of [
		[ isUint8Array, Uint8Array ],
		[ isUint8ClampedArray, Uint8ClampedArray ],
		[ isUint16Array, Uint16Array ],
		[ isUint32Array, Uint32Array ],
		[ isInt8Array, Int8Array ],
		[ isInt16Array, Int16Array ],
		[ isInt32Array, Int32Array ],
		[ isFloat32Array, Float32Array ],
		[ isFloat64Array, Float64Array ]
	]) {
		if (check(value)) {
			return clazz;
		}
	}
}

let lazyNullPrototypeCache;
// Creates a subclass and name
// the constructor as `${clazz} : null prototype`
function clazzWithNullPrototype(clazz, name) {
	if (lazyNullPrototypeCache === undefined) {
		lazyNullPrototypeCache = new Map();
	} else {
		const cachedClass = lazyNullPrototypeCache.get(clazz);
		if (cachedClass !== undefined) {
			return cachedClass;
		}
	}
	class NullPrototype extends clazz {
		get [Symbol.toStringTag]() {
			return '';
		}
	}
	Object.defineProperty(
		NullPrototype.prototype.constructor,
		'name',
		{ value: `[${name}: null prototype]` }
	);
	lazyNullPrototypeCache.set(clazz, NullPrototype);
	return NullPrototype;
}

function noPrototypeIterator(ctx, value, recurseTimes) {
	let newVal;
	if (isSet(value)) {
		const clazz = clazzWithNullPrototype(Set, 'Set');
		newVal = new clazz(SetPrototype.values(value));
	} else if (isMap(value)) {
		const clazz = clazzWithNullPrototype(Map, 'Map');
		newVal = new clazz(MapPrototype.entries(value));
	} else if (Array.isArray(value)) {
		const clazz = clazzWithNullPrototype(Array, 'Array');
		newVal = new clazz(value.length);
	} else if (isTypedArray(value)) {
		const constructor = findTypedConstructor(value);
		const clazz = clazzWithNullPrototype(constructor, constructor.name);
		newVal = new clazz(value);
	}
	if (newVal !== undefined) {
		Object.defineProperties(newVal, Object.getOwnPropertyDescriptors(value));
		return formatRaw(ctx, newVal, recurseTimes);
	}
}

function formatValue(ctx, value, recurseTimes, typedArray) {
	// Primitive types cannot have properties.
	if (typeof value !== 'object' && typeof value !== 'function') {
		return formatPrimitive(ctx.stylize, value, ctx);
	}
	if (value === null) {
		return ctx.stylize('null', 'null');
	}
	// Memorize the context for custom inspection on proxies.
	const context = value;
	/*
	@fixme check for proxies
	// Always check for proxies to prevent side effects and to prevent triggering
	// any proxy handlers.
	const proxy = getProxyDetails(value);
	if (proxy !== undefined) {
		if (ctx.showProxy) {
			return formatProxy(ctx, proxy, recurseTimes);
		}
		value = proxy[0];
	}
	*/
	// Provide a hook for user-specified inspect functions.
	// Check that value is an object with an inspect function on it.
	if (ctx.customInspect) {
		const maybeCustom = value[customInspectSymbol];
		if (typeof maybeCustom === 'function'
				// Filter out the util module, its inspect function is special.
				&& maybeCustom !== inspect
				// Also filter out any prototype objects using the circular check.
				&& !(value.constructor && value.constructor.prototype === value)) {
			// This makes sure the recurseTimes are reported as before while using
			// a counter internally.
			const depth = ctx.depth === null ? null : ctx.depth - recurseTimes;
			const ret = maybeCustom.call(context, depth, getUserOptions(ctx));
			// If the custom inspection method returned `this`, don't go into
			// infinite recursion.
			if (ret !== context) {
				if (typeof ret !== 'string') {
					return formatValue(ctx, ret, recurseTimes);
				}
				return ret.replace(/\n/g, `\n${' '.repeat(ctx.indentationLvl)}`);
			}
		}
	}
	// Using an array here is actually better for the average case than using
	// a Set. `seen` will only check for the depth and will never grow too large.
	if (ctx.seen.includes(value)) {
		let index = 1;
		if (ctx.circular === undefined) {
			ctx.circular = new Map([ [ value, index ] ]);
		} else {
			index = ctx.circular.get(value);
			if (index === undefined) {
				index = ctx.circular.size + 1;
				ctx.circular.set(value, index);
			}
		}
		return ctx.stylize(`[Circular *${index}]`, 'special');
	}
	return formatRaw(ctx, value, recurseTimes, typedArray);
}

function formatRaw(ctx, value, recurseTimes, typedArray) {
	let keys;

	const constructor = getConstructorName(value, ctx);
	let tag = value[Symbol.toStringTag];
	// Only list the tag in case it's non-enumerable / not an own property.
	// Otherwise we'd print this twice.
	if (typeof tag !== 'string'
			|| tag !== ''
			&& (ctx.showHidden ? hasOwnProperty : propertyIsEnumerable)(
				value, Symbol.toStringTag
			)) {
		tag = '';
	}
	let base = '';
	let formatter = getEmptyFormatArray;
	let braces;
	let noIterator = true;
	let i = 0;
	const filter = ctx.showHidden ? ALL_PROPERTIES : ONLY_ENUMERABLE;

	let extrasType = kObjectType;

	// Iterators and the rest are split to reduce checks.
	if (value[Symbol.iterator]) {
		noIterator = false;
		if (Array.isArray(value)) {
			keys = getOwnNonIndexProperties(value, filter);
			// Only set the constructor for non ordinary ("Array [...]") arrays.
			const prefix = getPrefix(constructor, tag, 'Array');
			braces = [ `${prefix === 'Array ' ? '' : prefix}[`, ']' ];
			if (value.length === 0 && keys.length === 0) {
				return `${braces[0]}]`;
			}
			extrasType = kArrayExtrasType;
			formatter = formatArray;
		} else if (isSet(value)) {
			keys = getKeys(value, ctx.showHidden);
			const prefix = getPrefix(constructor, tag, 'Set');
			if (value.size === 0 && keys.length === 0) {
				return `${prefix}{}`;
			}
			braces = [ `${prefix}{`, '}' ];
			formatter = formatSet;
		} else if (isMap(value)) {
			keys = getKeys(value, ctx.showHidden);
			const prefix = getPrefix(constructor, tag, 'Map');
			if (value.size === 0 && keys.length === 0) {
				return `${prefix}{}`;
			}
			braces = [ `${prefix}{`, '}' ];
			formatter = formatMap;
		} else if (isTypedArray(value)) {
			keys = getOwnNonIndexProperties(value, filter);
			const prefix = constructor !== null
				? getPrefix(constructor, tag)
				: getPrefix(constructor, tag, findTypedConstructor(value).name);
			braces = [ `${prefix}[`, ']' ];
			if (value.length === 0 && keys.length === 0 && !ctx.showHidden) {
				return `${braces[0]}]`;
			}
			formatter = formatTypedArray;
			extrasType = kArrayExtrasType;
		} else if (isMapIterator(value)) {
			keys = getKeys(value, ctx.showHidden);
			braces = getIteratorBraces('Map', tag);
			formatter = formatIterator;
		} else if (isSetIterator(value)) {
			keys = getKeys(value, ctx.showHidden);
			braces = getIteratorBraces('Set', tag);
			formatter = formatIterator;
		} else {
			noIterator = true;
		}
	}

	if (noIterator) {
		keys = getKeys(value, ctx.showHidden);
		braces = [ '{', '}' ];
		if (constructor === 'Object') {
			if (isArgumentsObject(value)) {
				braces[0] = '[Arguments] {';
			} else if (tag !== '') {
				braces[0] = `${getPrefix(constructor, tag, 'Object')}{`;
			}
			if (keys.length === 0) {
				return `${braces[0]}}`;
			}
		} else if (typeof value === 'function') {
			base = getFunctionBase(value, constructor, tag);
			if (keys.length === 0) {
				return ctx.stylize(base, 'special');
			}
		} else if (isRegExp(value)) {
			// Make RegExps say that they are RegExps
			// eslint-disable-next-line security/detect-non-literal-regexp
			const regExp = constructor !== null ? value : new RegExp(value);
			base = RegExpPrototype.toString.call(regExp);
			const prefix = getPrefix(constructor, tag, 'RegExp');
			if (prefix !== 'RegExp ') {
				base = `${prefix}${base}`;
			}
			if (keys.length === 0 || recurseTimes > ctx.depth && ctx.depth !== null) {
				return ctx.stylize(base, 'regexp');
			}
		} else if (isDate(value)) {
			// Make dates with properties first say the date
			base = Number.isNaN(DatePrototype.getTime.call(value))
				? DatePrototype.toString.call(value)
				: DatePrototype.toISOString.call(value);
			const prefix = getPrefix(constructor, tag, 'Date');
			if (prefix !== 'Date ') {
				base = `${prefix}${base}`;
			}
			if (keys.length === 0) {
				return ctx.stylize(base, 'date');
			}
		} else if (isError(value)) {
			base = formatError(value, constructor, tag, ctx);
			if (keys.length === 0) {
				return base;
			} else if (isIos) {
				const nativeErrorProps = [ 'line', 'column', 'sourceURL' ];
				if (keys.every(key => nativeErrorProps.includes(key))) {
					return base;
				}
			}
		} else if (isAnyArrayBuffer(value)) {
			// Fast path for ArrayBuffer and SharedArrayBuffer.
			// Can't do the same for DataView because it has a non-primitive
			// .buffer property that we need to recurse for.
			const arrayType = isArrayBuffer(value) ? 'ArrayBuffer' : 'SharedArrayBuffer';
			const prefix = getPrefix(constructor, tag, arrayType);
			if (typedArray === undefined) {
				formatter = formatArrayBuffer;
			} else if (keys.length === 0) {
				return `${prefix}{ byteLength: ${formatNumber(ctx.stylize, value.byteLength)} }`;
			}
			braces[0] = `${prefix}{`;
			keys.unshift('byteLength');
		} else if (isDataView(value)) {
			braces[0] = `${getPrefix(constructor, tag, 'DataView')}{`;
			// .buffer goes last, it's not a primitive like the others.
			keys.unshift('byteLength', 'byteOffset', 'buffer');
		} else if (isPromise(value)) {
			braces[0] = `${getPrefix(constructor, tag, 'Promise')}{`;
			formatter = formatPromise;
		} else if (isWeakSet(value)) {
			braces[0] = `${getPrefix(constructor, tag, 'WeakSet')}{`;
			formatter = ctx.showHidden ? formatWeakSet : formatWeakCollection;
		} else if (isWeakMap(value)) {
			braces[0] = `${getPrefix(constructor, tag, 'WeakMap')}{`;
			formatter = ctx.showHidden ? formatWeakMap : formatWeakCollection;
		/*
		 * @fixme how to do isModuleNamespaceObject?
		} else if (isModuleNamespaceObject(value)) {
			braces[0] = `[${tag}] {`;
			formatter = formatNamespaceObject;
		*/
		} else if (isBoxedPrimitive(value)) {
			base = getBoxedBase(value, ctx, keys, constructor, tag);
			if (keys.length === 0) {
				return base;
			}
		} else {
			// The input prototype got manipulated. Special handle these. We have to
			// rebuild the information so we are able to display everything.
			if (constructor === null) {
				const specialIterator = noPrototypeIterator(ctx, value, recurseTimes);
				if (specialIterator) {
					return specialIterator;
				}
			}
			if (isMapIterator(value)) {
				braces = getIteratorBraces('Map', tag);
				formatter = formatIterator;
			} else if (isSetIterator(value)) {
				braces = getIteratorBraces('Set', tag);
				formatter = formatIterator;
			// Handle other regular objects again.
			} else {
				if (keys.length === 0) {
					return `${getCtxStyle(value, constructor, tag)}{}`;
				}
				braces[0] = `${getCtxStyle(value, constructor, tag)}{`;
			}
		}
	}
	if (recurseTimes > ctx.depth && ctx.depth !== null) {
		let constructorName = getCtxStyle(value, constructor, tag).slice(0, -1);
		if (constructor !== null) {
			constructorName = `[${constructorName}]`;
		}
		return ctx.stylize(constructorName, 'special');
	}
	recurseTimes += 1;
	ctx.seen.push(value);
	ctx.currentDepth = recurseTimes;
	let output;
	const indentationLvl = ctx.indentationLvl;
	try {
		output = formatter(ctx, value, recurseTimes, keys, braces);
		for (i = 0; i < keys.length; i++) {
			output.push(
				formatProperty(ctx, value, recurseTimes, keys[i], extrasType));
		}
	} catch (err) {
		const constructorName = getCtxStyle(value, constructor, tag).slice(0, -1);
		return handleMaxCallStackSize(ctx, err, constructorName, indentationLvl);
	}
	if (ctx.circular !== undefined) {
		const index = ctx.circular.get(value);
		if (index !== undefined) {
			const reference = ctx.stylize(`<ref *${index}>`, 'special');
			// Add reference always to the very beginning of the output.
			if (ctx.compact !== true) {
				base = base === '' ? reference : `${reference} ${base}`;
			} else {
				braces[0] = `${reference} ${braces[0]}`;
			}
		}
	}
	ctx.seen.pop();
	if (ctx.sorted) {
		const comparator = ctx.sorted === true ? undefined : ctx.sorted;
		if (extrasType === kObjectType) {
			output = output.sort(comparator);
		} else if (keys.length > 1) {
			const sorted = output.slice(output.length - keys.length).sort(comparator);
			output.splice(output.length - keys.length, keys.length, ...sorted);
		}
	}
	const res = reduceToSingleString(
		ctx, output, base, braces, extrasType, recurseTimes, value);
	const budget = ctx.budget[ctx.indentationLvl] || 0;
	const newLength = budget + res.length;
	ctx.budget[ctx.indentationLvl] = newLength;
	// If any indentationLvl exceeds this limit, limit further inspecting to the
	// minimum. Otherwise the recursive algorithm might continue inspecting the
	// object even though the maximum string size (~2 ** 28 on 32 bit systems and
	// ~2 ** 30 on 64 bit systems) exceeded. The actual output is not limited at
	// exactly 2 ** 27 but a bit higher. This depends on the object shape.
	// This limit also makes sure that huge objects don't block the event loop
	// significantly.
	if (newLength > 2 ** 27) {
		ctx.depth = -1;
	}
	return res;
}

function getIteratorBraces(type, tag) {
	if (tag !== `${type} Iterator`) {
		if (tag !== '') {
			tag += '] [';
		}
		tag += `${type} Iterator`;
	}
	return [ `[${tag}] {`, '}' ];
}

function getBoxedBase(value, ctx, keys, constructor, tag) {
	let fn;
	let type;
	if (isNumberObject(value)) {
		fn = NumberPrototype;
		type = 'Number';
	} else if (isStringObject(value)) {
		fn = StringPrototype;
		type = 'String';
		// For boxed Strings, we have to remove the 0-n indexed entries,
		// since they just noisy up the output and are redundant
		// Make boxed primitive Strings look like such
		keys.splice(0, value.length);
	} else if (isBooleanObject(value)) {
		fn = BooleanPrototype;
		type = 'Boolean';
	} else {
		fn = SymbolPrototype;
		type = 'Symbol';
	}
	let base = `[${type}`;
	if (type !== constructor) {
		if (constructor === null) {
			base += ' (null prototype)';
		} else {
			base += ` (${constructor})`;
		}
	}
	base += `: ${formatPrimitive(stylizeNoColor, fn.valueOf(value), ctx)}]`;
	if (tag !== '' && tag !== constructor) {
		base += ` [${tag}]`;
	}
	if (keys.length !== 0 || ctx.stylize === stylizeNoColor) {
		return base;
	}
	return ctx.stylize(base, type.toLowerCase());
}

function getFunctionBase(value, constructor, tag) {
	let type = 'Function';
	if (isGeneratorFunction(value)) {
		type = `Generator${type}`;
	}
	if (isAsyncFunction(value)) {
		type = `Async${type}`;
	}
	let base = `[${type}`;
	if (constructor === null) {
		base += ' (null prototype)';
	}
	if (value.name === '') {
		base += ' (anonymous)';
	} else {
		base += `: ${value.name}`;
	}
	base += ']';
	if (constructor !== type && constructor !== null) {
		base += ` ${constructor}`;
	}
	if (tag !== '' && constructor !== tag) {
		base += ` [${tag}]`;
	}
	return base;
}

function formatError(err, constructor, tag, ctx) {
	let stack = err.stack || ErrorPrototype.toString.call(err);
	// try to normalize JavaScriptCore stack to match v8
	if (isIos) {
		const lines = stack.split('\n');
		stack = `${err.name}: ${err.message}`;
		if (lines.length > 0) {
			stack += lines.map(stackLine => {
				const atSymbolIndex = stackLine.indexOf('@');
				const source = stackLine.slice(atSymbolIndex + 1);
				const sourcePattern = /(.*):(\d+):(\d+)/;
				let symbolName = 'unknown';
				if (atSymbolIndex !== -1) {
					symbolName = stackLine.slice(0, atSymbolIndex);
				}

				const sourceMatch = source.match(sourcePattern);
				if (sourceMatch) {
					let filePath = sourceMatch[1];
					const lineNumber = sourceMatch[2];
					const column = sourceMatch[3];
					if (filePath.startsWith('file:')) {
						filePath = filePath.replace(`file://${Ti.Filesystem.resourcesDirectory}`, '');
					}

					return `\n    at ${symbolName} (${filePath}:${lineNumber}:${column})`;
				} else {
					return `\n    at ${symbolName} (${source})`;
				}
			}).join('');
		}
	}

	// A stack trace may contain arbitrary data. Only manipulate the output
	// for "regular errors" (errors that "look normal") for now.
	const name = err.name || 'Error';
	let len = name.length;
	if (constructor === null
			|| name.endsWith('Error')
			&& stack.startsWith(name)
			&& (stack.length === len || stack[len] === ':' || stack[len] === '\n')) {
		let fallback = 'Error';
		if (constructor === null) {
			const start = stack.match(/^([A-Z][a-z_ A-Z0-9[\]()-]+)(?::|\n {4}at)/)
				|| stack.match(/^([a-z_A-Z0-9-]*Error)$/);
			fallback = start && start[1] || '';
			len = fallback.length;
			fallback = fallback || 'Error';
		}
		const prefix = getPrefix(constructor, tag, fallback).slice(0, -1);
		if (name !== prefix) {
			if (prefix.includes(name)) {
				if (len === 0) {
					stack = `${prefix}: ${stack}`;
				} else {
					stack = `${prefix}${stack.slice(len)}`;
				}
			} else {
				stack = `${prefix} [${name}]${stack.slice(len)}`;
			}
		}
	}

	// Ignore the error message if it's contained in the stack.
	let pos = err.message && stack.indexOf(err.message) || -1;
	if (pos !== -1) {
		pos += err.message.length;
	}
	// Wrap the error in brackets in case it has no stack trace.
	let stackStart = stack.indexOf('\n    at', pos);

	if (stackStart === -1) {
		stack = `[${stack}]`;
	} else if (ctx.colors) {
		// Highlight userland code and node modules.
		let newStack = stack.slice(0, stackStart);
		const lines = stack.slice(stackStart + 1).split('\n');
		for (const line of lines) {
			// This adds underscores to all node_modules to quickly identify them.
			let nodeModule;
			newStack += '\n';
			let pos = 0;
			while (nodeModule = nodeModulesRegExp.exec(line)) {
				// '/node_modules/'.length === 14
				newStack += line.slice(pos, nodeModule.index + 14);
				newStack += ctx.stylize(nodeModule[1], 'module');
				pos = nodeModule.index + nodeModule[0].length;
			}
			newStack += pos === 0 ? line : line.slice(pos);
		}
		stack = newStack;
	}
	// The message and the stack have to be indented as well!
	if (ctx.indentationLvl !== 0) {
		const indentation = ' '.repeat(ctx.indentationLvl);
		stack = stack.replace(/\n/g, `\n${indentation}`);
	}
	return stack;
}

function formatPromise(ctx, _value, _recurseTimes) {
	// Node calls into native to get promise details which we can't do
	return [ ctx.stylize('<unknown>', 'special') ];
}

function formatProperty(ctx, value, recurseTimes, key, type) {
	let name, str;
	let extra = ' ';
	const desc = Object.getOwnPropertyDescriptor(value, key)
		|| { value: value[key], enumerable: true };
	if (desc.value !== undefined) {
		const diff = (type !== kObjectType || ctx.compact !== true) ? 2 : 3;
		ctx.indentationLvl += diff;
		str = formatValue(ctx, desc.value, recurseTimes);
		if (diff === 3) {
			const len = ctx.colors ? removeColors(str).length : str.length;
			if (ctx.breakLength < len) {
				extra = `\n${' '.repeat(ctx.indentationLvl)}`;
			}
		}
		ctx.indentationLvl -= diff;
	} else if (desc.get !== undefined) {
		const label = desc.set !== undefined ? 'Getter/Setter' : 'Getter';
		const s = ctx.stylize;
		const sp = 'special';
		if (ctx.getters && (ctx.getters === true
				|| ctx.getters === 'get' && desc.set === undefined
				|| ctx.getters === 'set' && desc.set !== undefined)) {
			try {
				const tmp = value[key];
				ctx.indentationLvl += 2;
				if (tmp === null) {
					str = `${s(`[${label}:`, sp)} ${s('null', 'null')}${s(']', sp)}`;
				} else if (typeof tmp === 'object') {
					str = `${s(`[${label}]`, sp)} ${formatValue(ctx, tmp, recurseTimes)}`;
				} else {
					const primitive = formatPrimitive(s, tmp, ctx);
					str = `${s(`[${label}:`, sp)} ${primitive}${s(']', sp)}`;
				}
				ctx.indentationLvl -= 2;
			} catch (err) {
				const message = `<Inspection threw (${err.message})>`;
				str = `${s(`[${label}:`, sp)} ${message}${s(']', sp)}`;
			}
		} else {
			str = ctx.stylize(`[${label}]`, sp);
		}
	} else if (desc.set !== undefined) {
		str = ctx.stylize('[Setter]', 'special');
	} else {
		str = ctx.stylize('undefined', 'undefined');
	}
	if (type === kArrayType) {
		return str;
	}
	if (typeof key === 'symbol') {
		const tmp = key.toString().replace(strEscapeSequencesReplacer, escapeFn);
		name = `[${ctx.stylize(tmp, 'symbol')}]`;
	} else if (desc.enumerable === false) {
		name = `[${key.replace(strEscapeSequencesReplacer, escapeFn)}]`;
	} else if (keyStrRegExp.test(key)) {
		name = ctx.stylize(key, 'name');
	} else {
		name = ctx.stylize(strEscape(key), 'string');
	}
	return `${name}:${extra}${str}`;
}

function groupArrayElements(ctx, output, value) {
	let totalLength = 0;
	let maxLength = 0;
	let i = 0;
	let outputLength = output.length;
	if (ctx.maxArrayLength < output.length) {
		// This makes sure the "... n more items" part is not taken into account.
		outputLength--;
	}
	const separatorSpace = 2; // Add 1 for the space and 1 for the separator.
	const dataLen = new Array(outputLength);
	// Calculate the total length of all output entries and the individual max
	// entries length of all output entries. We have to remove colors first,
	// otherwise the length would not be calculated properly.
	for (; i < outputLength; i++) {
		const len = ctx.colors ? removeColors(output[i]).length : output[i].length;
		dataLen[i] = len;
		totalLength += len + separatorSpace;
		if (maxLength < len) {
			maxLength = len;
		}
	}
	// Add two to `maxLength` as we add a single whitespace character plus a comma
	// in-between two entries.
	const actualMax = maxLength + separatorSpace;
	// Check if at least three entries fit next to each other and prevent grouping
	// of arrays that contains entries of very different length (i.e., if a single
	// entry is longer than 1/5 of all other entries combined). Otherwise the
	// space in-between small entries would be enormous.
	if (actualMax * 3 + ctx.indentationLvl < ctx.breakLength
			&& (totalLength / actualMax > 5 || maxLength <= 6)) {
		const approxCharHeights = 2.5;
		const averageBias = Math.sqrt(actualMax - totalLength / output.length);
		const biasedMax = Math.max(actualMax - 3 - averageBias, 1);
		// Dynamically check how many columns seem possible.
		const columns = Math.min(
			// Ideally a square should be drawn. We expect a character to be about 2.5
			// times as high as wide. This is the area formula to calculate a square
			// which contains n rectangles of size `actualMax * approxCharHeights`.
			// Divide that by `actualMax` to receive the correct number of columns.
			// The added bias increases the columns for short entries.
			Math.round(
				Math.sqrt(
					approxCharHeights * biasedMax * outputLength
				) / biasedMax
			),
			// Do not exceed the breakLength.
			Math.floor((ctx.breakLength - ctx.indentationLvl) / actualMax),
			// Limit array grouping for small `compact` modes as the user requested
			// minimal grouping.
			ctx.compact * 4,
			// Limit the columns to a maximum of fifteen.
			15
		);
		// Return with the original output if no grouping should happen.
		if (columns <= 1) {
			return output;
		}
		const tmp = [];
		const maxLineLength = [];
		for (let i = 0; i < columns; i++) {
			let lineMaxLength = 0;
			for (let j = i; j < output.length; j += columns) {
				if (dataLen[j] > lineMaxLength) {
					lineMaxLength = dataLen[j];
				}
			}
			lineMaxLength += separatorSpace;
			maxLineLength[i] = lineMaxLength;
		}
		let order = 'padStart';
		if (value !== undefined) {
			for (let i = 0; i < output.length; i++) {
				if (typeof value[i] !== 'number') {
					order = 'padEnd';
					break;
				}
			}
		}
		// Each iteration creates a single line of grouped entries.
		for (let i = 0; i < outputLength; i += columns) {
			// The last lines may contain less entries than columns.
			const max = Math.min(i + columns, outputLength);
			let str = '';
			let j = i;
			for (; j < max - 1; j++) {
				// Calculate extra color padding in case it's active. This has to be
				// done line by line as some lines might contain more colors than
				// others.
				const padding = maxLineLength[j - i] + output[j].length - dataLen[j];
				str += `${output[j]}, `[order](padding, ' ');
			}
			if (order === 'padStart') {
				const padding = maxLineLength[j - i]
					+ output[j].length
					- dataLen[j]
					- separatorSpace;
				str += output[j].padStart(padding, ' ');
			} else {
				str += output[j];
			}
			tmp.push(str);
		}
		if (ctx.maxArrayLength < output.length) {
			tmp.push(output[outputLength]);
		}
		output = tmp;
	}
	return output;
}

function handleMaxCallStackSize(ctx, err, constructorName, indentationLvl) {
	if (isStackOverflowError(err)) {
		ctx.seen.pop();
		ctx.indentationLvl = indentationLvl;
		return ctx.stylize(
			`[${constructorName}: Inspection interrupted 'prematurely. Maximum call stack size exceeded.]`,
			'special'
		);
	}
	throw err;
}

function formatNumber(fn, value) {
	// Format -0 as '-0'. Checking `value === -0` won't distinguish 0 from -0.
	return fn(Object.is(value, -0) ? '-0' : `${value}`, 'number');
}
function formatBigInt(fn, value) {
	return fn(`${value}n`, 'bigint');
}

function formatPrimitive(fn, value, ctx) {
	if (typeof value === 'string') {
		if (ctx.compact !== true
				&& value.length > kMinLineLength
				&& value.length > ctx.breakLength - ctx.indentationLvl - 4) {
			return value.split(/\n/)
				.map((line) => fn(strEscape(line), 'string'))
				.join(` +\n${' '.repeat(ctx.indentationLvl + 2)}`);
		}
		return fn(strEscape(value), 'string');
	}
	if (typeof value === 'number') {
		return formatNumber(fn, value);
	}
	/*
	if (typeof value === 'bigint') {
		return formatBigInt(fn, value);
	}
	*/
	if (typeof value === 'boolean') {
		return fn(`${value}`, 'boolean');
	}
	if (typeof value === 'undefined') {
		return fn('undefined', 'undefined');
	}
	// es6 symbol primitive
	return fn(SymbolPrototype.toString.call(value), 'symbol');
}

// The array is sparse and/or has extra keys
function formatSpecialArray(ctx, value, recurseTimes, maxLength, output, i) {
	const keys = Object.keys(value);
	let index = i;
	for (; i < keys.length && output.length < maxLength; i++) {
		const key = keys[i];
		const tmp = +key;
		// Arrays can only have up to 2^32 - 1 entries
		if (tmp > 2 ** 32 - 2) {
			break;
		}
		if (`${index}` !== key) {
			if (!numberRegExp.test(key)) {
				break;
			}
			const emptyItems = tmp - index;
			const ending = emptyItems > 1 ? 's' : '';
			const message = `<${emptyItems} empty item${ending}>`;
			output.push(ctx.stylize(message, 'undefined'));
			index = tmp;
			if (output.length === maxLength) {
				break;
			}
		}
		output.push(formatProperty(ctx, value, recurseTimes, key, kArrayType));
		index++;
	}
	const remaining = value.length - index;
	if (output.length !== maxLength) {
		if (remaining > 0) {
			const ending = remaining > 1 ? 's' : '';
			const message = `<${remaining} empty item${ending}>`;
			output.push(ctx.stylize(message, 'undefined'));
		}
	} else if (remaining > 0) {
		output.push(`... ${remaining} more item${remaining > 1 ? 's' : ''}`);
	}
	return output;
}

function formatArrayBuffer(ctx, value) {
	const buffer = new Uint8Array(value);
	/*
	// @fixme rollup cannot handle lazy loaded modules, maybe move to webpack?
	if (hexSlice === undefined) {
		hexSlice = uncurryThis(require('../../buffer').default.Buffer.prototype.hexSlice);
	}
	*/
	let str = hexSlice(buffer, 0, Math.min(ctx.maxArrayLength, buffer.length))
		.replace(/(.{2})/g, '$1 ').trim();
	const remaining = buffer.length - ctx.maxArrayLength;
	if (remaining > 0) {
		str += ` ... ${remaining} more byte${remaining > 1 ? 's' : ''}`;
	}
	return [ `${ctx.stylize('[Uint8Contents]', 'special')}: <${str}>` ];
}

function formatArray(ctx, value, recurseTimes) {
	const valLen = value.length;
	const len = Math.min(Math.max(0, ctx.maxArrayLength), valLen);
	const remaining = valLen - len;
	const output = [];
	for (var i = 0; i < len; i++) {
		// Special handle sparse arrays.
		if (!hasOwnProperty(value, i)) {
			return formatSpecialArray(ctx, value, recurseTimes, len, output, i);
		}
		output.push(formatProperty(ctx, value, recurseTimes, i, kArrayType));
	}
	if (remaining > 0) {
		output.push(`... ${remaining} more item${remaining > 1 ? 's' : ''}`);
	}
	return output;
}

function formatTypedArray(ctx, value, recurseTimes) {
	const maxLength = Math.min(Math.max(0, ctx.maxArrayLength), value.length);
	const remaining = value.length - maxLength;
	const output = new Array(maxLength);
	const elementFormatter = value.length > 0 && typeof value[0] === 'number' ? formatNumber : formatBigInt;
	for (let i = 0; i < maxLength; ++i) {
		output[i] = elementFormatter(ctx.stylize, value[i]);
	}
	if (remaining > 0) {
		output[maxLength] = `... ${remaining} more item${remaining > 1 ? 's' : ''}`;
	}
	if (ctx.showHidden) {
		// .buffer goes last, it's not a primitive like the others.
		ctx.indentationLvl += 2;
		for (const key of [
			'BYTES_PER_ELEMENT',
			'length',
			'byteLength',
			'byteOffset',
			'buffer'
		]) {
			const str = formatValue(ctx, value[key], recurseTimes, true);
			output.push(`[${key}]: ${str}`);
		}
		ctx.indentationLvl -= 2;
	}
	return output;
}

function formatSet(ctx, value, recurseTimes) {
	const output = [];
	ctx.indentationLvl += 2;
	for (const v of value) {
		output.push(formatValue(ctx, v, recurseTimes));
	}
	ctx.indentationLvl -= 2;
	// With `showHidden`, `length` will display as a hidden property for
	// arrays. For consistency's sake, do the same for `size`, even though this
	// property isn't selected by Object.getOwnPropertyNames().
	if (ctx.showHidden) {
		output.push(`[size]: ${ctx.stylize(`${value.size}`, 'number')}`);
	}
	return output;
}

function formatMap(ctx, value, recurseTimes) {
	const output = [];
	ctx.indentationLvl += 2;
	for (const [ k, v ] of value) {
		output.push(`${formatValue(ctx, k, recurseTimes)} => ${formatValue(ctx, v, recurseTimes)}`);
	}
	ctx.indentationLvl -= 2;
	// See comment in formatSet
	if (ctx.showHidden) {
		output.push(`[size]: ${ctx.stylize(`${value.size}`, 'number')}`);
	}
	return output;
}

function formatSetIterInner(ctx, recurseTimes, entries, state) {
	const maxArrayLength = Math.max(ctx.maxArrayLength, 0);
	const maxLength = Math.min(maxArrayLength, entries.length);
	let output = new Array(maxLength);
	ctx.indentationLvl += 2;
	for (var i = 0; i < maxLength; i++) {
		output[i] = formatValue(ctx, entries[i], recurseTimes);
	}
	ctx.indentationLvl -= 2;
	if (state === kWeak && !ctx.sorted) {
		// Sort all entries to have a halfway reliable output (if more entries than
		// retrieved ones exist, we can not reliably return the same output) if the
		// output is not sorted anyway.
		output = output.sort();
	}
	const remaining = entries.length - maxLength;
	if (remaining > 0) {
		output.push(`... ${remaining} more item${remaining > 1 ? 's' : ''}`);
	}
	return output;
}

function formatMapIterInner(ctx, recurseTimes, entries, state) {
	const maxArrayLength = Math.max(ctx.maxArrayLength, 0);
	// Entries exist as [key1, val1, key2, val2, ...]
	const len = entries.length / 2;
	const remaining = len - maxArrayLength;
	const maxLength = Math.min(maxArrayLength, len);
	let output = new Array(maxLength);
	let i = 0;
	ctx.indentationLvl += 2;
	if (state === kWeak) {
		for (; i < maxLength; i++) {
			const pos = i * 2;
			output[i] = `${formatValue(ctx, entries[pos], recurseTimes)}`
				+ ` => ${formatValue(ctx, entries[pos + 1], recurseTimes)}`;
		}
		// Sort all entries to have a halfway reliable output (if more entries than
		// retrieved ones exist, we can not reliably return the same output) if the
		// output is not sorted anyway.
		if (!ctx.sorted) {
			output = output.sort();
		}
	} else {
		for (; i < maxLength; i++) {
			const pos = i * 2;
			const res = [
				formatValue(ctx, entries[pos], recurseTimes),
				formatValue(ctx, entries[pos + 1], recurseTimes)
			];
			output[i] = reduceToSingleString(
				ctx, res, '', [ '[', ']' ], kArrayExtrasType, recurseTimes);
		}
	}
	ctx.indentationLvl -= 2;
	if (remaining > 0) {
		output.push(`... ${remaining} more item${remaining > 1 ? 's' : ''}`);
	}
	return output;
}

function formatWeakCollection(ctx) {
	return [ ctx.stylize('<items unknown>', 'special') ];
}

function formatWeakSet(ctx, _value, _recurseTimes) {
	// Node calls into native to get a preview of actual values which we can't do
	return formatWeakCollection(ctx);
}

function formatWeakMap(ctx, _value, _recurseTimes) {
	// Node calls into native to get a preview of actual values which we can't do
	return formatWeakCollection(ctx);
}

function formatIterator(ctx, value, recurseTimes, _keys, braces) {
	const entries = [];
	let isKeyValue = false;
	let result = value.next();
	while (!result.done) {
		const currentEntry = result.value;
		entries.push(currentEntry);
		if (currentEntry[0] !== currentEntry[1]) {
			isKeyValue = true;
		}
		result = value.next();
	}
	if (isKeyValue) {
		// Mark entry iterators as such.
		braces[0] = braces[0].replace(/ Iterator] {$/, ' Entries] {');
		return formatMapIterInner(ctx, recurseTimes, entries, kMapEntries);
	}
	return formatSetIterInner(ctx, recurseTimes, entries, kIterator);
}

function isBelowBreakLength(ctx, output, start, base) {
	// Each entry is separated by at least a comma. Thus, we start with a total
	// length of at least `output.length`. In addition, some cases have a
	// whitespace in-between each other that is added to the total as well.
	let totalLength = output.length + start;
	if (totalLength + output.length > ctx.breakLength) {
		return false;
	}
	for (var i = 0; i < output.length; i++) {
		if (ctx.colors) {
			totalLength += removeColors(output[i]).length;
		} else {
			totalLength += output[i].length;
		}
		if (totalLength > ctx.breakLength) {
			return false;
		}
	}
	// Do not line up properties on the same line if `base` contains line breaks.
	return base === '' || !base.includes('\n');
}

function reduceToSingleString(ctx, output, base, braces, extrasType, recurseTimes, value) {
	if (ctx.compact !== true) {
		if (typeof ctx.compact === 'number' && ctx.compact >= 1) {
			// Memorize the original output length. In case the the output is grouped,
			// prevent lining up the entries on a single line.
			const entries = output.length;
			// Group array elements together if the array contains at least six
			// separate entries.
			if (extrasType === kArrayExtrasType && entries > 6) {
				output = groupArrayElements(ctx, output, value);
			}
			// `ctx.currentDepth` is set to the most inner depth of the currently
			// inspected object part while `recurseTimes` is the actual current depth
			// that is inspected.
			//
			// Example:
			//
			// const a = { first: [ 1, 2, 3 ], second: { inner: [ 1, 2, 3 ] } }
			//
			// The deepest depth of `a` is 2 (a.second.inner) and `a.first` has a max
			// depth of 1.
			//
			// Consolidate all entries of the local most inner depth up to
			// `ctx.compact`, as long as the properties are smaller than
			// `ctx.breakLength`.
			if (ctx.currentDepth - recurseTimes < ctx.compact && entries === output.length) {
				// Line up all entries on a single line in case the entries do not
				// exceed `breakLength`. Add 10 as constant to start next to all other
				// factors that may reduce `breakLength`.
				const start = output.length + ctx.indentationLvl + braces[0].length + base.length + 10;
				if (isBelowBreakLength(ctx, output, start, base)) {
					return `${base ? `${base} ` : ''}${braces[0]} ${join(output, ', ')} ${braces[1]}`;
				}
			}
		}
		// Line up each entry on an individual line.
		const indentation = `\n${' '.repeat(ctx.indentationLvl)}`;
		return `${base ? `${base} ` : ''}${braces[0]}${indentation}  `
			+ `${join(output, `,${indentation}  `)}${indentation}${braces[1]}`;
	}
	// Line up all entries on a single line in case the entries do not exceed
	// `breakLength`.
	if (isBelowBreakLength(ctx, output, 0, base)) {
		return `${braces[0]}${base ? ` ${base}` : ''} ${join(output, ', ')} ` + braces[1];
	}
	const indentation = ' '.repeat(ctx.indentationLvl);
	// If the opening "brace" is too large, like in the case of "Set {",
	// we need to force the first item to be on the next line or the
	// items will not line up correctly.
	const ln = base === '' && braces[0].length === 1 ? ' ' : `${base ? ` ${base}` : ''}\n${indentation}  `;
	// Line up each entry on an individual line.
	return `${braces[0]}${ln}${join(output, `,\n${indentation}  `)} ${braces[1]}`;
}

export function format(...args) {
	return formatWithOptions(undefined, ...args);
}

const firstErrorLine = (error) => error.message.split('\n')[0];
let CIRCULAR_ERROR_MESSAGE;
function tryStringify(arg) {
	try {
		return JSON.stringify(arg);
	} catch (err) {
		// Populate the circular error message lazily
		if (!CIRCULAR_ERROR_MESSAGE) {
			try {
				const a = {};
				a.a = a;
				JSON.stringify(a);
			} catch (e) {
				CIRCULAR_ERROR_MESSAGE = firstErrorLine(e);
			}
		}
		if (err.name === 'TypeError'
				&& firstErrorLine(err) === CIRCULAR_ERROR_MESSAGE) {
			return '[Circular]';
		}
		throw err;
	}
}

/* eslint-disable max-depth */
export function formatWithOptions(inspectOptions, ...args) {
	const first = args[0];
	let a = 0;
	let str = '';
	let join = '';
	if (typeof first === 'string') {
		if (args.length === 1) {
			return first;
		}
		let tempStr;
		let lastPos = 0;
		for (var i = 0; i < first.length - 1; i++) {
			if (first.charCodeAt(i) === 37) { // '%'
				const nextChar = first.charCodeAt(++i);
				if (a + 1 !== args.length) {
					switch (nextChar) {
						case 115: // 's'
							const tempArg = args[++a];
							if (typeof tempArg === 'number') {
								tempStr = formatNumber(stylizeNoColor, tempArg);
							/*
							} else if (typeof tempArg === 'bigint') {
								tempStr = `${tempArg}n`;
							*/
							} else {
								let constr;
								if (typeof tempArg !== 'object'
										|| tempArg === null
										|| typeof tempArg.toString === 'function'
										&& (hasOwnProperty(tempArg, 'toString')
												// A direct own property on the constructor prototype in
												// case the constructor is not an built-in object.
												|| (constr = tempArg.constructor)
												&& !builtInObjects.has(constr.name)
												&& constr.prototype
												&& hasOwnProperty(constr.prototype, 'toString')
										)
								) {
									tempStr = String(tempArg);
								} else {
									tempStr = inspect(tempArg, {
										...inspectOptions,
										compact: 3,
										colors: false,
										depth: 0
									});
								}
							}
							break;
						case 106: // 'j'
							tempStr = tryStringify(args[++a]);
							break;
						case 100: // 'd'
							const tempNum = args[++a];
							/*
							if (typeof tempNum === 'bigint') {
								tempStr = `${tempNum}n`;
							} else
							*/
							if (typeof tempNum === 'symbol') {
								tempStr = 'NaN';
							} else {
								tempStr = formatNumber(stylizeNoColor, Number(tempNum));
							}
							break;
						case 79: // 'O'
							tempStr = inspect(args[++a], inspectOptions);
							break;
						case 111: // 'o'
						{
							tempStr = inspect(args[++a], {
								...inspectOptions,
								showHidden: true,
								showProxy: true,
								depth: 4
							});
							break;
						}
						case 105: // 'i'
							const tempInteger = args[++a];
							/*
							if (typeof tempInteger === 'bigint') {
								tempStr = `${tempInteger}n`;
							} else */
							if (typeof tempInteger === 'symbol') {
								tempStr = 'NaN';
							} else {
								tempStr = formatNumber(stylizeNoColor, parseInt(tempInteger));
							}
							break;
						case 102: // 'f'
							const tempFloat = args[++a];
							if (typeof tempFloat === 'symbol') {
								tempStr = 'NaN';
							} else {
								tempStr = formatNumber(stylizeNoColor, parseFloat(tempFloat));
							}
							break;
						case 37: // '%'
							str += first.slice(lastPos, i);
							lastPos = i + 1;
							continue;
						default: // Any other character is not a correct placeholder
							continue;
					}
					if (lastPos !== i - 1) {
						str += first.slice(lastPos, i - 1);
					}
					str += tempStr;
					lastPos = i + 1;
				} else if (nextChar === 37) {
					str += first.slice(lastPos, i);
					lastPos = i + 1;
				}
			}
		}
		if (lastPos !== 0) {
			a++;
			join = ' ';
			if (lastPos < first.length) {
				str += first.slice(lastPos);
			}
		}
	}
	while (a < args.length) {
		const value = args[a];
		str += join;
		str += typeof value !== 'string' ? inspect(value, inspectOptions) : value;
		join = ' ';
		a++;
	}
	return str;
}
/* eslint-enable max-depth */
