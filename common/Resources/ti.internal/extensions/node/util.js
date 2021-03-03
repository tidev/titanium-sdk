import assertArgumentType from './_errors';
import * as types from './internal/util/types';
import { format, formatWithOptions, inspect } from './internal/util/inspect';
import Buffer from './buffer';

const MONTHS = [
	'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const util = {
	format,
	formatWithOptions,
	inspect,
	isArray: Array.isArray,
	isBoolean: value => typeof value === 'boolean',
	isBuffer: Buffer.Buffer.isBuffer,
	isFunction: value => typeof value === 'function',
	isNull: value => value === null,
	isNullOrUndefined: value => value === undefined || value === null,
	isNumber: value => typeof value === 'number',
	isObject: value => value !== null && typeof value === 'object',
	isPrimitive: value => (typeof value !== 'object' && typeof value !== 'function') || value === null,
	isString: value => typeof value === 'string',
	isSymbol: value => typeof value === 'symbol',
	isUndefined: value => value === undefined,
	isRegExp: types.isRegExp,
	isDate: types.isDate,
	isError: (e) => Object.prototype.toString.call(e) === '[object Error]' || e instanceof Error,
	log: string => {
		const date = new Date();
		const time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
		// Produces output like: "21 Feb 10:04:23 - message"
		console.log(`${date.getDate()} ${MONTHS[date.getMonth()]} ${time} - ${string}`);
	},
	print: (...args) => console.log(args.join('')), // FIXME: Shouldn't add trailing newline like console.log does!
	puts: (...args) => console.log(args.join('\n')),
	error: (...args) => console.error(args.join('\n')),
	debug: string => console.error(`DEBUG: ${string}`),
	types
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
