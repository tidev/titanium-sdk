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
 * Node's lib/internal/util/types.js modified for Axway Titanium
 *
 * @see https://github.com/nodejs/node/blob/master/lib/internal/util/types.js
 */

import { isBuffer, uncurryThis } from '../util';

const TypedArrayPrototype = Object.getPrototypeOf(Uint8Array.prototype);

const TypedArrayProto_toStringTag = uncurryThis(
	Object.getOwnPropertyDescriptor(TypedArrayPrototype, Symbol.toStringTag).get);

function isObject(value) {
	return typeof value === 'object';
}

function isFunction(value) {
	return typeof value === 'function';
}

function checkPrototype(value, name) {
	return Object.prototype.toString.call(value) === `[object ${name}]`;
}

export function isAnyArrayBuffer(value) {
	if (isArrayBuffer(value)) {
		return true;
	}

	return isSharedArrayBuffer(value);
}

export function isArgumentsObject(value) {
	return isObject(value) && checkPrototype(value, 'Arguments');
}

export function isArrayBuffer(value) {
	return isObject(value) && checkPrototype(value, 'ArrayBuffer');
}

// Cached to make sure no userland code can tamper with it.
export const isArrayBufferView = ArrayBuffer.isView;

export function isAsyncFunction(value) {
	return isFunction(value) && checkPrototype(value, 'AsyncFunction');
}

export function isBigInt64Array(value) {
	return TypedArrayProto_toStringTag(value) === 'BigInt64Array';
}

export function isBigUint64Array(value) {
	return TypedArrayProto_toStringTag(value) === 'BigUint64Array';
}

export function isBooleanObject(value) {
	return isObject(value) && checkPrototype(value, 'Boolean');
}

export function isBoxedPrimitive(value) {
	if (!isObject(value)) {
		return false;
	}

	return isNumberObject(value)
		|| isStringObject(value)
		|| isBooleanObject(value)
		// || isBigIntObject(value)
		|| isSymbolObject(value);
}

export function isDataView(value) {
	return isObject(value) && checkPrototype(value, 'DataView');
}

export function isDate(value) {
	return isObject(value) && checkPrototype(value, 'Date');
}

// @todo isExternal

export function isFloat32Array(value) {
	return TypedArrayProto_toStringTag(value) === 'Float32Array';
}

export function isFloat64Array(value) {
	return TypedArrayProto_toStringTag(value) === 'Float64Array';
}

export function isGeneratorFunction(value) {
	return isFunction(value) && checkPrototype(value, 'GeneratorFunction');
}

export function isGeneratorObject(value) {
	return isObject(value) && checkPrototype(value, 'Generator');
}

export function isInt8Array(value) {
	return TypedArrayProto_toStringTag(value) === 'Int8Array';
}

export function isInt16Array(value) {
	return TypedArrayProto_toStringTag(value) === 'Int16Array';
}

export function isInt32Array(value) {
	return TypedArrayProto_toStringTag(value) === 'Int32Array';
}

export function isMap(value) {
	return isObject(value) && checkPrototype(value, 'Map');
}

export function isMapIterator(value) {
	if (typeof value !== 'object') {
		return false;
	}

	const prototype = Object.getPrototypeOf(value);
	return prototype && prototype[Symbol.toStringTag] === 'Map Iterator';
}

// @todo isModuleNamespaceObject

export function isNativeError(value) {
	// if not an instance of an Error, definitely not a native error
	if (!(value instanceof Error)) {
		return false;
	}
	if (!value || !value.constructor) {
		return false;
	}
	return [
		'Error',
		'EvalError',
		'RangeError',
		'ReferenceError',
		'SyntaxError',
		'TypeError',
		'URIError'
	].includes(value.constructor.name);
}

export function isNumberObject(value) {
	return isObject(value) && checkPrototype(value, 'Number');
}

export function isPromise(value) {
	return isObject(value) && checkPrototype(value, 'Promise');
}

// @todo isProxy

export function isRegExp(value) {
	return isObject(value) && checkPrototype(value, 'RegExp');
}

export function isSet(value) {
	return isObject(value) && checkPrototype(value, 'Set');
}

export function isSetIterator(value) {
	if (typeof value !== 'object') {
		return false;
	}

	const prototype = Object.getPrototypeOf(value);
	return prototype && prototype[Symbol.toStringTag] === 'Set Iterator';
}

export function isSharedArrayBuffer(value) {
	if (!global.SharedArrayBuffer) {
		return false;
	}

	return isObject(value) && checkPrototype(value, 'SharedArrayBuffer');
}

export function isStringObject(value) {
	return isObject(value) && checkPrototype(value, 'String');
}

export function isSymbolObject(value) {
	return isObject(value) && checkPrototype(value, 'Symbol');
}

export function isTypedArray(value) {
	const isBuiltInTypedArray = TypedArrayProto_toStringTag(value) !== undefined;
	if (isBuiltInTypedArray) {
		return true;
	}

	return value[isBuffer] === true;
}

export function isUint8Array(value) {
	return TypedArrayProto_toStringTag(value) === 'Uint8Array';
}

export function isUint8ClampedArray(value) {
	return TypedArrayProto_toStringTag(value) === 'Uint8ClampedArray';
}

export function isUint16Array(value) {
	return TypedArrayProto_toStringTag(value) === 'Uint16Array';
}

export function isUint32Array(value) {
	return TypedArrayProto_toStringTag(value) === 'Uint32Array';
}

export function isWeakMap(value) {
	return isObject(value) && checkPrototype(value, 'WeakMap');
}

export function isWeakSet(value) {
	return isObject(value) && checkPrototype(value, 'WeakSet');
}

// @todo isWebAssemblyCompiledModule
