import { uncurryThis } from '../util';

const TypedArrayPrototype = Object.getPrototypeOf(Uint8Array.prototype);

const TypedArrayProto_toStringTag = uncurryThis(
	Object.getOwnPropertyDescriptor(TypedArrayPrototype, Symbol.toStringTag).get);

function checkPrototype(value, name) {
	if (typeof value !== 'object') {
		return false;
	}

	return Object.prototype.toString.call(value) === `[object ${name}]`;
}

export function isAnyArrayBuffer(value) {
	if (isArrayBuffer(value)) {
		return true;
	}

	return isSharedArrayBuffer(value);
}

export function isArgumentsObject(value) {
	return checkPrototype(value, 'Arguments');
}

export function isArrayBuffer(value) {
	return checkPrototype(value, 'ArrayBuffer');
}

// Cached to make sure no userland code can tamper with it.
export const isArrayBufferView = ArrayBuffer.isView;

export function isAsyncFunction(value) {
	return checkPrototype(value, 'AsyncFunction');
}

export function isBigInt64Array(value) {
	return TypedArrayProto_toStringTag(value) === 'BigInt64Array';
}

export function isBigUint64Array(value) {
	return TypedArrayProto_toStringTag(value) === 'BigUint64Array';
}

export function isBooleanObject(value) {
	return checkPrototype(value, 'Boolean');
}

export function isBoxedPrimitive(value) {
	if (typeof value !== 'object') {
		return false;
	}

	return isNumberObject(value)
		|| isStringObject(value)
		|| isBooleanObject(value)
		// || isBigIntObject(value)
		|| isSymbolObject(value);
}

export function isDataView(value) {
	return checkPrototype(value, 'DataView');
}

export function isDate(value) {
	return checkPrototype(value, 'Date');
}

// @todo isExternal

export function isFloat32Array(value) {
	return TypedArrayProto_toStringTag(value) === 'Float32Array';
}

export function isFloat64Array(value) {
	return TypedArrayProto_toStringTag(value) === 'Float64Array';
}

export function isGeneratorFunction(value) {
	return checkPrototype(value, 'GeneratorFunction');
}

export function isGeneratorObject(value) {
	return checkPrototype(value, 'GeneratorObject');
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
	return checkPrototype(value, 'Map');
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
	return checkPrototype(value, 'Number');
}

export function isPromise(value) {
	return checkPrototype(value, 'Promise');
}

// @todo isProxy

export function isRegExp(value) {
	return checkPrototype(value, 'RegExp');
}

export function isSet(value) {
	return checkPrototype(value, 'Set');
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

	return checkPrototype(value, 'SharedArrayBuffer');
}

export function isStringObject(value) {
	return checkPrototype(value, 'String');
}

export function isSymbolObject(value) {
	return checkPrototype(value, 'Symbol');
}

export function isTypedArray(value) {
	return TypedArrayProto_toStringTag(value) !== undefined;
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
	return checkPrototype(value, 'WeakMap');
}

export function isWeakSet(value) {
	return checkPrototype(value, 'WeakSet');
}

// @todo isWebAssemblyCompiledModule
