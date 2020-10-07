/**
 * This implementation of Buffer uses a Ti.Buffer internally to back it.
 * This is likley an order of magnitude slower than using a variant that extends Uint8Array!
 * I think if we're not already wrapping a Ti.Buffer, it may be better to have two implementations
 * and, like browserify, just extend Uint8Array for any Buffers we need to read/write a lot
 * and then add a simple conversion method to turn it into a Ti.Buffer when needed.
 *
 * The Ti.Buffer impl has to go through the binding layer for reading/writing every byte.
 * If we anticipate the Buffer staying on the JS side, I'm willing to bet that the Uint8Array
 * the JS engine provides would be *way* faster.
 *
 * Also note that both Ti.Buffer and Node's Buffer were created before the JS engines had typed arrays
 * (and Uint8Array in particular) as a means of encapsulating a byte array. We should consider accepting
 * a Uint8Array in any of our APIs that take a Ti.Buffer and eventually deprecating/removing Ti.Buffer.
 */

import {
	customInspectSymbol,
	getOwnNonIndexProperties,
	isBuffer,
	isInsideNodeModules,
	propertyFilter
} from './internal/util';
import {
	isAnyArrayBuffer
} from './internal/util/types';
import { codes } from './internal/errors';
import { inspect as utilInspect } from './internal/util/inspect';
import SlowBuffer from './slowbuffer';
import { FastBuffer, stringToHexBytes } from './internal/buffer';

const { ALL_PROPERTIES, ONLY_ENUMERABLE } = propertyFilter;

const VALID_ENCODINGS = [
	'hex',
	'utf8',
	'utf-8',
	'ascii',
	'latin1',
	'binary',
	'base64',
	'ucs2',
	'ucs-2',
	'utf16le',
	'utf-16le'
];

// Used to cheat for read/writes of doubles
const doubleArray = new Float64Array(1);
const uint8DoubleArray = new Uint8Array(doubleArray.buffer);

// Used to cheat to read/write floats
const floatArray = new Float32Array(1);
const uint8FloatArray = new Uint8Array(floatArray.buffer);

// Node.js does some very weird stuff here
FastBuffer.prototype.constructor = Buffer; // new FastBuffer() calls Buffer function?
Buffer.prototype = FastBuffer.prototype; // Then it hijacks Buffer's prototype to point at FastBuffer's?!
// Does this effectively mean Buffer extends Uint8Array, because FastBuffer did? This fails for me
// How the hell can we make it happy? We really want to extend Uint8Array if we can
// addBufferPrototypeMethods(Buffer.prototype); // Here's where it hangs some of the methods

Buffer.poolSize = 8192;

/**
 * Constructs a new buffer.
 *
 * Primarily used internally in this module together with `newBuffer` to
 * create a new Buffer instance wrapping a Ti.Buffer.
 *
 * Also supports the deprecated Buffer() constructors which are safe
 * to use outside of this module.
 *
 * @param {integer[]|Buffer|integer|string|Ti.Buffer} arg the underlying data/bytes
 * @param {string|integer} encodingOrOffset encoding of the string, or start offset of array/buffer
 * @param {integer} length length of the underlying array/buffer to wrap
 * @returns {Buffer}
 */
function Buffer(arg, encodingOrOffset, length) {
	if (arg === undefined) {
		return;
	}

	if (typeof arg !== 'object' || arg.apiName !== 'Ti.Buffer') {
		showFlaggedDeprecation();

		if (typeof arg === 'number') {
			if (typeof encodingOrOffset === 'string') {
				throw new TypeError(`The "string" argument must be of type "string". Received type ${typeof arg}`);
			}
			return Buffer.alloc(arg);
		}
		return Buffer.from(arg, encodingOrOffset, length);
	}

	// The slow case - we're wrapping a Ti.Buffer
	return SlowBuffer.fromTiBuffer(arg, encodingOrOffset, length);
}

/**
 * @param {integer[]|Buffer|string} value value we're wrapping
 * @param {string|number} [encodingOrOffset]
 * @param {number} [length]
 * @returns {Buffer}
 */
Buffer.from = function (value, encodingOrOffset, length) {
	const valueType = typeof value;
	if (valueType === 'string') {
		return fromString(value, encodingOrOffset);
	} else if (valueType === 'object') {
		if (isAnyArrayBuffer(value)) {
			return fromArrayBuffer(value, encodingOrOffset, length);
		}

		if (Array.isArray(value) || value instanceof Uint8Array) {
			return fromArray(value);
		}
		if (Buffer.isBuffer(value)) {
			return fromBuffer(value);
		}
		// We want to limit the use of SlowBuffers to only when we're wrapping a Ti.Buffer, hopefully!
		if (value.apiName && value.apiName === 'Ti.Buffer') {
			return SlowBuffer.fromTiBuffer(value);
		}
	}
	throw new TypeError('The \'value\' argument must be one of type: \'string\', \'Array\', \'Buffer\', \'Ti.Buffer\'');
};

/**
 * @param {ArrayBuffer} obj ArrayBuffer to wrap
 * @param {number} [byteOffset=0] byte offste to begin
 * @param {number} [length] length to wrap
 * @returns {Buffer}
 */
function fromArrayBuffer(obj, byteOffset, length) {
	// Convert byteOffset to integer
	if (byteOffset === undefined) {
		byteOffset = 0;
	} else {
		byteOffset = +byteOffset;
		if (Number.isNaN(byteOffset)) {
			byteOffset = 0;
		}
	}

	const maxLength = obj.byteLength - byteOffset;
	if (maxLength < 0) {
		throw new codes.ERR_BUFFER_OUT_OF_BOUNDS('offset');
	}

	if (length === undefined) {
		length = maxLength;
	} else {
		// Convert length to non-negative integer.
		length = +length;
		if (length > 0) {
			if (length > maxLength) {
				throw new codes.ERR_BUFFER_OUT_OF_BOUNDS('length');
			}
		} else {
			length = 0;
		}
	}

	return new FastBuffer(obj, byteOffset, length);
}

/**
 * @param {string} value value to wrap
 * @param {string} [encoding='utf8'] character encoding
 * @returns {Buffer}
 */
function fromString(value, encoding = 'utf8') {
	if (!Buffer.isEncoding(encoding)) {
		throw new TypeError(`Unknown encoding: ${encoding}`);
	}
	encoding = encoding.toLowerCase();
	if (encoding === 'base64') {
		const blob = Ti.Utils.base64decode(value);
		return new FastBuffer(blob.toArrayBuffer());
	}
	if (encoding === 'hex') {
		return fromArray(stringToHexBytes(value));
	}
	// Convert the SlowBuffer to a fast buffer by just copying bytes recursively here
	return fromBuffer(SlowBuffer.fromString(value, encoding));
}

/**
 * @param {integer[]|Uint8Array|array} value values to wrap
 * @returns {Buffer}
 */
function fromArray(value) {
	const length = value.length;
	if (length === 0) {
		return new FastBuffer();
	}
	return new FastBuffer(value);
}

/**
 * Ideally this should only be used when we're copying a SlowBuffer into a new FastBuffer
 * @param {Buffer} value buffer to copy
 * @returns {Buffer}
 */
function fromBuffer(value) {
	const length = value.length;
	if (length === 0) {
		return new FastBuffer();
	}

	const buffer = Buffer.allocUnsafe(length);
	value.copy(buffer, 0, 0, length);
	return buffer;
}

Object.setPrototypeOf(Buffer, Uint8Array); // What is this doing?! Making Buffer.prototype point at Uint8Array now

/**
 * 0 is returned if target is the same as buf
 * 1 is returned if target should come before buf when sorted.
 * -1 is returned if target should come after buf when sorted.
 * @param {Buffer} target Buffer to compare against
 * @param {integer} [targetStart=0] index to start in target
 * @param {integer} [targetEnd=target.length] index to end in target
 * @param {integer} [sourceStart=0] index to start in this Buffer
 * @param {integer} [sourceEnd=this.length] index to end in this Buffer
 * @returns {integer}
 */
Buffer.prototype.compare = function (target, targetStart, targetEnd, sourceStart, sourceEnd) {
	if (!Buffer.isBuffer(target)) {
		throw new TypeError(`The "target" argument must be one of type Buffer or Uint8Array. Received type ${typeof buf1}`);
	}
	if (targetStart === undefined) {
		targetStart = 0;
	}
	if (sourceStart === undefined) {
		sourceStart = 0;
	}
	if (targetEnd === undefined) {
		targetEnd = target.length;
	}
	if (sourceEnd === undefined) {
		sourceEnd = this.length;
	}

	// ERR_OUT_OF_RANGE is thrown if targetStart < 0, sourceStart < 0, targetEnd > target.byteLength, or sourceEnd > source.byteLength
	if (targetStart < 0 || sourceStart < 0 || targetEnd > target.length || sourceEnd > this.length) {
		throw new RangeError('Index out of range'); // FIXME: set "code" to ERR_INDEX_OUT_OF_RANGE
	}

	// Use slices to make the loop easier
	const source = this.slice(sourceStart, sourceEnd);
	const sourceLength = source.length;
	const dest = target.slice(targetStart, targetEnd);
	const destLength = dest.length;
	const length = Math.min(sourceLength, destLength);

	for (let i = 0; i < length; i++) {
		const targetValue = dest.getAdjustedIndex(i);
		const sourceValue = source.getAdjustedIndex(i);
		if (targetValue !== sourceValue) {
			// No match! Return 1 or -1 based on what is greater!
			if (sourceValue < targetValue) {
				return -1;
			}
			return 1;
		}
	}

	// sort based on length!
	if (sourceLength < destLength) {
		return -1;
	}
	if (sourceLength > destLength) {
		return 1;
	}
	return 0;
};

/**
 * Copies from this to target
 * @param {Buffer} target destination we're copying into
 * @param {integer} [targetStart=0] start index to copy into in destination Buffer
 * @param {integer} [sourceStart=0] start index to copy from within `this`
 * @param {integer} [sourceEnd=this.length] end index to copy from within `this`
 * @returns {integer} number of bytes copied
 */
Buffer.prototype.copy = function (target, targetStart, sourceStart, sourceEnd) {
	if (targetStart === undefined) {
		targetStart = 0;
	}
	if (sourceStart === undefined) {
		sourceStart = 0;
	}
	if (sourceEnd === undefined) {
		sourceEnd = this.length;
	}
	if (sourceStart === sourceEnd) {
		return 0;
	}
	if (target.length === 0 || this.length === 0) {
		return 0;
	}
	// TODO: check for out of bounds?
	let length = sourceEnd - sourceStart;
	// Cap length to remaining bytes in target!
	const remaining = target.length - targetStart;
	if (length > remaining) {
		sourceEnd = sourceStart + remaining;
		length = remaining;
	}
	// Determine actual number of bytes we'll copy, constrain by source buffer length as well as target (above)
	let numBytes = length;
	const sourceLen = this.length - sourceStart;
	if (numBytes > sourceLen) {
		numBytes = sourceLen;
	}

	// TODO: handle overlap when target === this!
	// TODO: Do we need to take target byteOffset into account here?
	let source = this;
	if (sourceStart !== 0 || sourceEnd < source.length) {
		source = new Uint8Array(this.buffer, this.byteOffset + sourceStart, numBytes);
	}
	target.set(source, targetStart);
	return numBytes;
};

/**
 * Creates and returns an iterator of [index, byte] pairs from the contents of buf.
 * @returns {Iterator}
 */
// TODO: Is this only necessary for SlowBuffer?
Buffer.prototype.entries = function () {
	const buffer = this;
	let nextIndex = 0;
	const end = this.length;
	const entryIterator = {
		next: function () {
			if (nextIndex < end) {
				const result = { value: [ nextIndex, buffer.getAdjustedIndex(nextIndex) ], done: false };
				nextIndex++;
				return result;
			}
			return { value: undefined, done: true };
		},
		[Symbol.iterator]: function () { return this; }
	};
	return entryIterator;
};

Buffer.prototype.equals = function (otherBuffer) {
	if (!Buffer.isBuffer(otherBuffer)) {
		throw new TypeError('argument must be a Buffer');
	}
	if (otherBuffer === this) {
		return true;
	}
	return this.compare(otherBuffer) === 0;
};

/**
 * @param {string|Buffer|UInt8Array|integer} value The value with which to fill `buf`.
 * @param {integer} [offset=0] Number of bytes to skip before starting to fill `buf`
 * @param {integer} [end] Where to stop filling buf (not inclusive). `buf.length` by default
 * @param {string} [encoding='utf8'] The encoding for `value` if `value` is a string.
 * @returns {this}
 */
Buffer.prototype.fill = function (value, offset, end, encoding) {
	const offsetType = typeof offset;
	if (offsetType === 'undefined') { // value supplied
		offset = 0;
		end = this.length;
		encoding = 'utf8';
	} else if (offsetType === 'string') { // value, encoding supplied
		encoding = offset;
		offset = 0;
		end = this.length;
	} else if (typeof end === 'string') { // value, offset, encoding supplied
		encoding = end;
		end = this.length;
	}

	this._fill(value, offset, end, encoding);
	return this;
};

const TypedArrayPrototype = Object.getPrototypeOf(Uint8Array.prototype);
const TypedArrayProto_byteLength = Object.getOwnPropertyDescriptor(TypedArrayPrototype, 'byteLength').get;
const TypedArrayFill = TypedArrayPrototype.fill;
Buffer.prototype._fill = function (value, offset, end, encoding) {
	if (typeof value === 'number') {
		// OOB check
		const byteLen = TypedArrayProto_byteLength.call(this);
		const fillLength = end - offset;
		if (offset > end || fillLength + offset > byteLen) {
			throw new codes.ERR_BUFFER_OUT_OF_BOUNDS();
		}

		TypedArrayFill.call(this, value, offset, end);
	} else {
		const bufToFillWith = SlowBuffer.fromString(value, encoding);
		const fillBufLength = bufToFillWith.length;
		if (fillBufLength === 0) {
			throw new Error('no valid fill data');
		}

		if (fillBufLength === 1) {
			TypedArrayFill.call(this, bufToFillWith._tiBuffer[0], offset, end);
			return this;
		}

		// multiple byte fill!
		const length = end - offset;
		for (let i = 0; i < length; i++) {
			// TODO: Do we need to account for byteOffset here (on `this`, not on the buffer we just created)?
			const fillChar = bufToFillWith._tiBuffer[i % fillBufLength];
			this.setAdjustedIndex(i + offset, fillChar);
		}
	}
};

Buffer.prototype.includes = function (value, byteOffset, encoding) {
	return this.indexOf(value, byteOffset, encoding) !== -1;
};

/**
 * @param {string|Buffer|integer} value What to search for
 * @param {integer} [byteOffset=0] Where to begin searching in buf. If negative, then offset is calculated from the end of buf
 * @param {string} [encoding='utf8'] If value is a string, this is the encoding used to determine the binary representation of the string that will be searched for in buf
 * @returns {integer} The index of the first occurrence of value in buf, or -1 if buf does not contain value.
 */
Buffer.prototype.indexOf = function (value, byteOffset, encoding) {
	if (this.length === 0) { // empty buffer? can't find anything!
		return -1;
	}

	// if byteOffset is undefined, make it 0
	if (typeof byteOffset === 'undefined') {
		byteOffset = 0;
	} else if (typeof byteOffset === 'string') {
		// if it's a string, that's actually encoding
		encoding = byteOffset;
		byteOffset = 0;
	}

	// if we don't have an encoding yet, use utf8
	if (typeof encoding !== 'string') {
		encoding = 'utf8';
	}

	if (byteOffset < 0) { // convert negative indices
		byteOffset = this.length + byteOffset;
		if (byteOffset < 0) { // still negative? start at 0
			byteOffset = 0;
		}
	} else if (byteOffset >= this.length) {
		return -1; // can't find past end of buffer!
	}

	if (typeof value === 'number') {
		value &= 0xFF; // clamp to 255
		// This is a simpler case, we have a single byte we need to search for
		// so just loop through and try to find it
		return indexOf(this, value, byteOffset);
	}

	// coerce a string to a Buffer
	if (typeof value === 'string') {
		value = fromString(value, encoding);
	}

	// value is now a Buffer...
	const matchLength = value.length;
	if (matchLength === 0) {
		return -1; // never find empty value!
	}

	if (matchLength === 1) {
		// simple case, match one byte!
		return indexOf(this, value[0], byteOffset);
	}

	let currentIndex = byteOffset;
	const thisLength = this.length;
	if (matchLength > thisLength) {
		return -1; // can't match if the value is longer than this Buffer!
	}

	// FIXME: Can we rewrite this in a less funky way?
	// FIXME: Can stop earlier based on matchLength!
	firstMatch: while (currentIndex < thisLength) { // eslint-disable-line no-labels
		// match first byte!
		let firstByteMatch = indexOf(this, value[0], currentIndex);
		if (firstByteMatch === -1) { // couldn't even match the very first byte, so no match overall!
			return -1;
		}

		// ok, we found the first byte, now we need to see if the next consecutive bytes match!
		for (let x = 1; x < matchLength; x++) {
			if (firstByteMatch + x >= thisLength) {
				currentIndex = firstByteMatch + 1; // move past our first match
				continue firstMatch; // eslint-disable-line no-labels
			}

			if (this[firstByteMatch + x] !== value[x]) { // didn't match!
				currentIndex = firstByteMatch + 1; // move past our first match
				continue firstMatch; // eslint-disable-line no-labels
			}
		}
		return firstByteMatch; // the rest matched, hurray!
	}
	return -1;
};

Buffer.prototype.keys = function () {
	let nextIndex = 0;
	const end = this.length;
	const myIterator = {
		next: function () {
			if (nextIndex < end) {
				const result = { value: nextIndex, done: false };
				nextIndex++;
				return result;
			}
			return { value: undefined, done: true };
		},
		[Symbol.iterator]: function () { return this; }
	};
	return myIterator;
};

/**
 * @param {integer} [offset=0] Number of bytes to skip before starting to read. Must satisfy 0 <= offset <= buf.length - 8
 * @returns {double} Reads a 64-bit double from buf at the specified offset with specified endian format
 */
Buffer.prototype.readDoubleBE = function (offset = 0) {
	checkOffset(this, offset, 8);

	// Node cheats and uses a Float64Array and UInt8Array backed by the same buffer
	// so basically it reads in the bytes stuffing them into Uint8Array, then returns the value from the Float64Array
	// FIXME: This assumes LE system byteOrder
	uint8DoubleArray[7] = this[offset++];
	uint8DoubleArray[6] = this[offset++];
	uint8DoubleArray[5] = this[offset++];
	uint8DoubleArray[4] = this[offset++];
	uint8DoubleArray[3] = this[offset++];
	uint8DoubleArray[2] = this[offset++];
	uint8DoubleArray[1] = this[offset++];
	uint8DoubleArray[0] = this[offset++];
	return doubleArray[0];
};

/**
 * @param {integer} [offset=0] Number of bytes to skip before starting to read. Must satisfy 0 <= offset <= buf.length - 8
 * @returns {double} Reads a 64-bit double from buf at the specified offset with specified endian format
 */
Buffer.prototype.readDoubleLE = function (offset = 0) {
	checkOffset(this, offset, 8);

	// Node cheats and uses a Float64Array and UInt8Array backed by the same buffer
	// so basically it reads in the bytes stuffing them into Uint8Array, then returns the value from the Float64Array
	// FIXME: This assumes LE system byteOrder
	uint8DoubleArray[0] = this[offset++];
	uint8DoubleArray[1] = this[offset++];
	uint8DoubleArray[2] = this[offset++];
	uint8DoubleArray[3] = this[offset++];
	uint8DoubleArray[4] = this[offset++];
	uint8DoubleArray[5] = this[offset++];
	uint8DoubleArray[6] = this[offset++];
	uint8DoubleArray[7] = this[offset++];
	return doubleArray[0];
};

/**
 * @param {integer} [offset=0] Number of bytes to skip before starting to read. Must satisfy 0 <= offset <= buf.length - 4
 * @returns {float} Reads a 32-bit float from buf at the specified offset with specified endian format
 */
Buffer.prototype.readFloatBE = function (offset = 0) {
	checkOffset(this, offset, 4);

	// Node cheats and uses a Float32Array and UInt8Array backed by the same buffer
	// so basically it reads in the bytes stuffing them into Uint8Array, then returns the value from the Float32Array
	// FIXME: This assumes LE system byteOrder
	uint8FloatArray[3] = this[offset++];
	uint8FloatArray[2] = this[offset++];
	uint8FloatArray[1] = this[offset++];
	uint8FloatArray[0] = this[offset++];
	return floatArray[0];
};

/**
 * @param {integer} [offset=0] Number of bytes to skip before starting to read. Must satisfy 0 <= offset <= buf.length - 4
 * @returns {float} Reads a 32-bit float from buf at the specified offset with specified endian format
 */
Buffer.prototype.readFloatLE = function (offset = 0) {
	checkOffset(this, offset, 4);

	// Node cheats and uses a Float32Array and UInt8Array backed by the same buffer
	// so basically it reads in the bytes stuffing them into Uint8Array, then returns the value from the Float32Array
	// FIXME: This assumes LE system byteOrder
	uint8FloatArray[0] = this[offset++];
	uint8FloatArray[1] = this[offset++];
	uint8FloatArray[2] = this[offset++];
	uint8FloatArray[3] = this[offset++];
	return floatArray[0];
};

/**
 * @param {integer} [offset=0] Number of bytes to skip before starting to read. Must satisfy 0 <= offset <= buf.length - 1.
 * @returns {integer}
 */
Buffer.prototype.readInt8 = function (offset = 0) {
	const unsignedValue = this.readUInt8(offset);
	return unsignedToSigned(unsignedValue, 1);
};

/**
 * @param {integer} [offset=0] Number of bytes to skip before starting to read. Must satisfy 0 <= offset <= buf.length - 2.
 * @returns {integer}
 */
Buffer.prototype.readInt16BE = function (offset) {
	const unsignedValue = this.readUInt16BE(offset);
	return unsignedToSigned(unsignedValue, 2);
};

/**
 * @param {integer} [offset=0] Number of bytes to skip before starting to read. Must satisfy 0 <= offset <= buf.length - 2.
 * @returns {integer}
 */
Buffer.prototype.readInt16LE = function (offset = 0) {
	const unsignedValue = this.readUInt16LE(offset);
	return unsignedToSigned(unsignedValue, 2);
};

/**
 * @param {integer} [offset=0] Number of bytes to skip before starting to read. Must satisfy 0 <= offset <= buf.length - 4.
 * @returns {integer}
 */
Buffer.prototype.readInt32BE = function (offset = 0) {
	const unsignedValue = this.readUInt32BE(offset);
	return unsignedToSigned(unsignedValue, 4);
};

/**
 * @param {integer} [offset=0] Number of bytes to skip before starting to read. Must satisfy 0 <= offset <= buf.length - 4.
 * @returns {integer}
 */
Buffer.prototype.readInt32LE = function (offset = 0) {
	const unsignedValue = this.readUInt32LE(offset);
	return unsignedToSigned(unsignedValue, 4);
};

/**
 * Reads byteLength number of bytes from buf at the specified offset and interprets the result as a two's complement signed value. Supports up to 48 bits of accuracy.
 * @param {integer} offset Number of bytes to skip before starting to read. Must satisfy 0 <= offset <= buf.length - byteLength.
 * @param {integer} byteLength umber of bytes to read. Must satisfy 0 < byteLength <= 6.
 * @returns {integer}
 */
Buffer.prototype.readIntBE = function (offset, byteLength) {
	const unsignedValue = this.readUIntBE(offset, byteLength);
	return unsignedToSigned(unsignedValue, byteLength);
};

/**
 * Reads byteLength number of bytes from buf at the specified offset and interprets the result as a two's complement signed value. Supports up to 48 bits of accuracy.
 * @param {integer} offset Number of bytes to skip before starting to read. Must satisfy 0 <= offset <= buf.length - byteLength.
 * @param {integer} byteLength umber of bytes to read. Must satisfy 0 < byteLength <= 6.
 * @returns {integer}
 */
Buffer.prototype.readIntLE = function (offset, byteLength) {
	const unsignedValue = this.readUIntLE(offset, byteLength);
	return unsignedToSigned(unsignedValue, byteLength);
};

/**
 * @param {integer} [offset=0] Number of bytes to skip before starting to read. Must satisfy 0 <= offset <= buf.length - 1.
 * @returns {integer}
 */
Buffer.prototype.readUInt8 = function (offset = 0) {
	checkOffset(this, offset, 1);
	return this[offset];
};

/**
 * @param {integer} [offset=0] Number of bytes to skip before starting to read. Must satisfy 0 <= offset <= buf.length - 2.
 * @returns {integer}
 */
Buffer.prototype.readUInt16BE = function (offset = 0) {
	checkOffset(this, offset, 2);
	// first byte shifted and OR'd with second byte
	return (this[offset] << 8) | this[offset + 1];
};

/**
 * @param {integer} [offset=0] Number of bytes to skip before starting to read. Must satisfy 0 <= offset <= buf.length - 2.
 * @returns {integer}
 */
Buffer.prototype.readUInt16LE = function (offset = 0) {
	checkOffset(this, offset, 2);
	// first byte OR'd with second byte shifted
	return this[offset] | (this[offset + 1] << 8);
};

/**
 * @param {integer} [offset=0] Number of bytes to skip before starting to read. Must satisfy 0 <= offset <= buf.length - 4.
 * @returns {integer}
 */
Buffer.prototype.readUInt32BE = function (offset = 0) {
	checkOffset(this, offset, 4);
	return (this[offset] * 0x1000000) + ((this[offset + 1] << 16) | (this[offset + 2] << 8) | this[offset + 3]);
	// rather than shifting by << 24, multiply the first byte and add it in so we don't retain the "sign bit"
	// (because bit-wise operators assume a 32-bit number)
};

/**
 * @param {integer} [offset=0] Number of bytes to skip before starting to read. Must satisfy 0 <= offset <= buf.length - 4.
 * @returns {integer}
 */
Buffer.prototype.readUInt32LE = function (offset = 0) {
	checkOffset(this, offset, 4);
	return (this[offset] | (this[offset + 1] << 8) | (this[offset + 2] << 16)) + (this[offset + 3] * 0x1000000);
	// rather than shifting by << 24, multiply the last byte and add it in so we don't retain the "sign bit"
};

/**
 * @param {integer} offset Number of bytes to skip before starting to read. Must satisfy 0 <= offset <= buf.length - byteLength.
 * @param {integer} byteLength Number of bytes to read. Must satisfy 0 < byteLength <= 6.
 * @returns {integer}
 */
Buffer.prototype.readUIntBE = function (offset, byteLength) {
	if (byteLength <= 0 || byteLength > 6) {
		throw new RangeError('Index out of range');
	}
	checkOffset(this, offset, byteLength);

	let result = 0;
	let multiplier = 1; // we use a multipler for each byte
	// we're doing the same loop as #readUIntLE, just backwards!
	for (let i = byteLength - 1; i >= 0; i--) {
		result += this.getAdjustedIndex(offset + i) * multiplier;
		multiplier *= 0x100; // move multiplier to next byte
	}
	return result;
};

/**
 * @param {integer} offset Number of bytes to skip before starting to read. Must satisfy 0 <= offset <= buf.length - byteLength.
 * @param {integer} byteLength Number of bytes to read. Must satisfy 0 < byteLength <= 6.
 * @returns {integer}
 */
Buffer.prototype.readUIntLE = function (offset, byteLength) {
	if (byteLength <= 0 || byteLength > 6) {
		throw new RangeError('Index out of range');
	}
	checkOffset(this, offset, byteLength);

	let result = 0;
	let multiplier = 1; // we use a multipler for each byte
	for (let i = 0; i < byteLength; i++) {
		result += this.getAdjustedIndex(offset + i) * multiplier;
		multiplier *= 0x100; // move multiplier to next byte
	}
	return result;
};

/**
 * @param {integer} [start=0] Where the new `Buffer` will start.
 * @param {integer} [end=this.length] Where the new Buffer will end (not inclusive). Default: `buf.length`.
 * @returns {Buffer}
 */
Buffer.prototype.slice = function (start, end) {
	const thisLength = this.length;
	if (typeof start === 'undefined') {
		start = 0;
	} else if (start < 0) {
		start = thisLength + start;
		if (start < 0) { // if this is still negative, use 0 (that matches Node)
			start = 0;
		}
	}
	if (typeof end === 'undefined') {
		end = thisLength;
	} else if (end < 0) {
		end = thisLength + end;
	}
	// Specifying end greater than buf.length will return the same result as that of end equal to buf.length.
	if (end > thisLength) {
		end = thisLength;
	}
	// What if end is less than start?
	let length = end - start;
	if (length <= 0) {
		length = 0; // return empty view of Buffer! retain byte offset, set length to 0
	}
	// Wrap the same ArrayBuffer object but specify the start/end to "crop" with
	return this._slice(this.byteOffset + start, length);
};

Buffer.prototype._slice = function (offset, length) {
	return new FastBuffer(this.buffer, offset, length);
};

/**
 * @param {integer} [start=0] Where the new `Buffer` will start.
 * @param {integer} [end=this.length] Where the new Buffer will end (not inclusive). Default: `buf.length`.
 * @returns {Buffer}
 */
Buffer.prototype.subarray = function (start, end) {
	return this.slice(start, end);
};

/**
 * Interprets buf as an array of unsigned 16-bit integers and swaps the byte order in-place.
 * Throws ERR_INVALID_BUFFER_SIZE if buf.length is not a multiple of 2.
 * @returns {Buffer}
 */
Buffer.prototype.swap16 = function () {
	const length = this.length;
	if (length % 2 !== 0) {
		throw new RangeError('Buffer size must be a multiple of 16-bits');
	}
	for (let i = 0; i < length; i += 2) {
		const first = this.getAdjustedIndex(i);
		const second = this.getAdjustedIndex(i + 1);
		this.setAdjustedIndex(i, second);
		this.setAdjustedIndex(i + 1, first);
	}
	return this;
};

/**
 * Interprets buf as an array of unsigned 32-bit integers and swaps the byte order in-place.
 * Throws ERR_INVALID_BUFFER_SIZE if buf.length is not a multiple of 4.
 * @returns {Buffer}
 */
Buffer.prototype.swap32 = function () {
	const length = this.length;
	if (length % 4 !== 0) {
		throw new RangeError('Buffer size must be a multiple of 32-bits');
	}
	for (let i = 0; i < length; i += 4) {
		const first = this.getAdjustedIndex(i);
		const second = this.getAdjustedIndex(i + 1);
		const third = this.getAdjustedIndex(i + 2);
		const fourth = this.getAdjustedIndex(i + 3);
		this.setAdjustedIndex(i, fourth);
		this.setAdjustedIndex(i + 1, third);
		this.setAdjustedIndex(i + 2, second);
		this.setAdjustedIndex(i + 3, first);
	}
	return this;
};

/**
 * Interprets buf as an array of unsigned 64-bit integers and swaps the byte order in-place.
 * Throws ERR_INVALID_BUFFER_SIZE if buf.length is not a multiple of 8.
 * @returns {Buffer}
 */
Buffer.prototype.swap64 = function () {
	const length = this.length;
	if (length % 8 !== 0) {
		throw new RangeError('Buffer size must be a multiple of 64-bits');
	}
	for (let i = 0; i < length; i += 8) {
		const first = this.getAdjustedIndex(i);
		const second = this.getAdjustedIndex(i + 1);
		const third = this.getAdjustedIndex(i + 2);
		const fourth = this.getAdjustedIndex(i + 3);
		const fifth = this.getAdjustedIndex(i + 4);
		const sixth = this.getAdjustedIndex(i + 5);
		const seventh = this.getAdjustedIndex(i + 6);
		const eighth = this.getAdjustedIndex(i + 7);
		this.setAdjustedIndex(i, eighth);
		this.setAdjustedIndex(i + 1, seventh);
		this.setAdjustedIndex(i + 2, sixth);
		this.setAdjustedIndex(i + 3, fifth);
		this.setAdjustedIndex(i + 4, fourth);
		this.setAdjustedIndex(i + 5, third);
		this.setAdjustedIndex(i + 6, second);
		this.setAdjustedIndex(i + 7, first);
	}
	return this;
};

/**
 * @returns {object}
 */
Buffer.prototype.toJSON = function () {
	return {
		type: 'Buffer',
		// Take advantage of slice working on "Array-like" objects (just like `arguments`)
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice#Array-like_objects
		data: [].slice.call(this)
	};
};

/**
 * @param {string} [encoding='utf8'] The character encoding to use
 * @param {integer} [start=0] The byte offset to start decoding at
 * @param {integer} [end] The byte offset to stop decoding at (not inclusive). `buf.length` default
 * @returns {string}
 */
Buffer.prototype.toString = function (encoding, start, end) {
	// fast case of no args
	if (arguments.length === 0) {
		return this.toTiBuffer().toString();
	}

	const length = this.length;
	if (start >= length) {
		return ''; // start is past end of buffer, return empty string
	}
	if (start < 0 || typeof start !== 'number') {
		start = 0;
	}

	if (end > length || typeof end !== 'number') { // no end specified, or past end of buffer, use length of buffer
		end = length;
	} // else keep end as passed in

	if (end <= start) {
		return ''; // if end is before start return empty string
	}

	// If start !== 0 and end !== length, maybe we should do a Buffer.subarray/slice over the range and call toString() on that?
	if (start !== 0 || end !== length) {
		return this.slice(start, end).toString(encoding);
	}

	// base case, start is 0, end is length
	if (encoding === undefined) {
		encoding = 'utf8';
	} else {
		encoding = encoding.toLowerCase();
		// Throw if bad encoding!
		if (!Buffer.isEncoding(encoding)) {
			throw new TypeError(`Unknown encoding: ${encoding}`);
		}
	}

	if (encoding === 'utf8' || encoding === 'utf-8') {
		return this.toTiBuffer().toString(); // we return utf-8 by default natively
	}

	if (encoding === 'base64') {
		return Ti.Utils.base64encode(this.toTiBuffer().toBlob()).toString();
	}

	if (encoding === 'hex') {
		return this.hexSlice(0, length);
	}

	if (encoding === 'latin1' || encoding === 'binary') {
		let latin1String = '';
		for (let i = 0; i < length; i++) {
			// each one is a "byte"
			latin1String += String.fromCharCode(this.getAdjustedIndex(i));
		}
		return latin1String;
	}

	if (encoding === 'ascii') {
		let ascii = '';
		for (let i = 0; i < length; i++) {
			// we store bytes (8-bit), but ascii is 7-bit. Node "masks" the last bit off, so let's do the same
			ascii += String.fromCharCode(this.getAdjustedIndex(i) & 0x7F);
		}
		return ascii;
	}

	// UCS2/UTF16
	return this.ucs2Slice(0, length);
};

Buffer.prototype.getAdjustedIndex = function (index) {
	return this[index];
};

Buffer.prototype.setAdjustedIndex = function (index, value) {
	return this[index] = value;
};

Buffer.prototype.hexSlice = function (start, end) {
	let hexStr = '';
	for (let i = start; i < end; i++) {
		// each one is a "byte"
		let hex = (this.getAdjustedIndex(i) & 0xff).toString(16);
		hex = (hex.length === 1) ? '0' + hex : hex;
		hexStr += hex;
	}
	return hexStr;
};

Buffer.prototype.ucs2Slice = function (start, end) {
	let out = '';
	let i = start;
	while (i < end) {
		// utf-16/ucs-2 is 2-bytes per character
		const byte1 = this.getAdjustedIndex(i++);
		const byte2 = this.getAdjustedIndex(i++);
		const code_unit = (byte2 << 8) + byte1; // we mash together the two bytes
		out += String.fromCodePoint(code_unit);
	}

	return out;
};

/**
 * Provides a conversion method for interacting with Ti APIs that require a Ti.Buffer
 * @returns {Ti.Buffer} the underlying Ti.Buffer backing this Buffer instance
 */
Buffer.prototype.toTiBuffer = function () {
	const tiBuffer = Ti.createBuffer({ length: this.length });
	copyBuffer(this, tiBuffer, 0, this.length);
	return tiBuffer;
};

/**
 * @param {Buffer} src source Buffer we're copying from
 * @param {Ti.Buffer} dest destination Ti.Buffer we're copying into
 * @param {integer} offset start offset we're copying to in destination
 * @param {integer} length number of bytes to copy
 * @returns {integer} actual number of bytes copied
 */
function copyBuffer(src, dest, offset, length) {
	const srcLength = src.length;
	const destLength = dest.length;
	let i = 0;
	for (; i < length; i++) {
		const destIndex = i + offset;
		// are we trying to write past end of destination? Or read past end of source? Stop!
		if ((destIndex >= destLength) || (i >= srcLength)) {
			break;
		}
		dest[destIndex] = src[i];
	}
	return i;
}

/**
 * Creates and returns an iterator for buf values (bytes)
 * @returns {Iterator}
 */
// TODO: Move to SlowBuffer?
Buffer.prototype.values = function () {
	const buffer = this;
	let nextIndex = 0;
	const end = this.length;
	const myIterator = {
		next: function () {
			if (nextIndex < end) {
				const result = { value: buffer.getAdjustedIndex(nextIndex), done: false };
				nextIndex++;
				return result;
			}
			return { value: undefined, done: true };
		},
		[Symbol.iterator]: function () { return this; }
	};
	return myIterator;
};

/**
 * Called when buffer is used in a for..of loop. Delegates to #values()
 * @returns {Iterator}
 */
// TODO: Move to SlowBuffer?
Buffer.prototype[Symbol.iterator] = function () {
	return this.values();
};

/**
 * Writes string to buf at offset according to the character encoding in encoding.
 * The length parameter is the number of bytes to write. If buf did not contain enough space to
 * fit the entire string, only part of string will be written. However, partially encoded
 * characters will not be written.
 * @param {string} string String to write to `buf`.
 * @param {integer} [offset=0] Number of bytes to skip before starting to write string
 * @param {integer} [length=buf.length - offset] Number of bytes to write
 * @param {string} [encoding='utf8'] The character encoding of string
 * @returns {integer}
 */
Buffer.prototype.write = function (string, offset, length, encoding) {
	if (typeof offset === 'string') {
		encoding = offset;
		offset = 0;
		length = this.length;
	} else if (typeof length === 'string') {
		encoding = length;
		length = this.length - offset;
	} else {
		// we cap `length` at the length of our buffer
		const remaining = this.length - offset;
		if (length > remaining) {
			length = remaining;
		}
	}
	encoding = encoding || 'utf8';
	// so we need to convert `remaining` bytes of our string into a byte array/buffer
	const src = fromString(string, encoding); // FIXME: Can we let it know to only convert `remaining` bytes?

	// then stick that into our buffer starting at `offset`!
	return src.copy(this, offset, 0, length);
};

Buffer.prototype.writeDoubleBE = function (value, offset = 0) {
	checkOffset(this, offset, 8);

	doubleArray[0] = value;
	this.setAdjustedIndex(offset++, uint8DoubleArray[7]);
	this.setAdjustedIndex(offset++, uint8DoubleArray[6]);
	this.setAdjustedIndex(offset++, uint8DoubleArray[5]);
	this.setAdjustedIndex(offset++, uint8DoubleArray[4]);
	this.setAdjustedIndex(offset++, uint8DoubleArray[3]);
	this.setAdjustedIndex(offset++, uint8DoubleArray[2]);
	this.setAdjustedIndex(offset++, uint8DoubleArray[1]);
	this.setAdjustedIndex(offset++, uint8DoubleArray[0]);

	return offset; // at this point, we should have already added 8 to offset
};

Buffer.prototype.writeDoubleLE = function (value, offset = 0) {
	checkOffset(this, offset, 8);

	doubleArray[0] = value;
	this.setAdjustedIndex(offset++, uint8DoubleArray[0]);
	this.setAdjustedIndex(offset++, uint8DoubleArray[1]);
	this.setAdjustedIndex(offset++, uint8DoubleArray[2]);
	this.setAdjustedIndex(offset++, uint8DoubleArray[3]);
	this.setAdjustedIndex(offset++, uint8DoubleArray[4]);
	this.setAdjustedIndex(offset++, uint8DoubleArray[5]);
	this.setAdjustedIndex(offset++, uint8DoubleArray[6]);
	this.setAdjustedIndex(offset++, uint8DoubleArray[7]);

	return offset; // at this point, we should have already added 8 to offset
};

Buffer.prototype.writeFloatBE = function (value, offset = 0) {
	checkOffset(this, offset, 4);

	floatArray[0] = value;
	this.setAdjustedIndex(offset++, uint8FloatArray[3]);
	this.setAdjustedIndex(offset++, uint8FloatArray[2]);
	this.setAdjustedIndex(offset++, uint8FloatArray[1]);
	this.setAdjustedIndex(offset++, uint8FloatArray[0]);

	return offset; // at this point, we should have already added 4 to offset
};

Buffer.prototype.writeFloatLE = function (value, offset = 0) {
	checkOffset(this, offset, 4);

	floatArray[0] = value;
	this.setAdjustedIndex(offset++, uint8FloatArray[0]);
	this.setAdjustedIndex(offset++, uint8FloatArray[1]);
	this.setAdjustedIndex(offset++, uint8FloatArray[2]);
	this.setAdjustedIndex(offset++, uint8FloatArray[3]);

	return offset; // at this point, we should have already added 4 to offset
};

/**
 * @param {integer} value Number to be written to buf.
 * @param {integer} [offset=0] Number of bytes to skip before starting to write. Must satisfy 0 <= offset <= buf.length - 1.
 * @returns {integer}
 */
Buffer.prototype.writeInt8 = function (value, offset = 0) {
	checkOffset(this, offset, 1);
	checkValue(value, -128, 127);

	if (value >= 0) {
		// just write it normally
		this.setAdjustedIndex(offset, value);
	} else {
		// convert from signed to 2's complement bits
		this.setAdjustedIndex(offset, (0xFF + value) + 1); // max value, plus the negative number, add one
	}

	return offset + 1;
};

/**
 * @param {integer} value Number to be written to buf.
 * @param {integer} [offset=0] Number of bytes to skip before starting to write. Must satisfy 0 <= offset <= buf.length - 2.
 * @returns {integer}
 */
Buffer.prototype.writeInt16BE = function (value, offset = 0) {
	checkOffset(this, offset, 2);
	checkValue(value, -32768, 32767);

	this.setAdjustedIndex(offset, value >>> 8); // just shift over a byte
	this.setAdjustedIndex(offset + 1, value & 0xFF); // mask to first byte

	return offset + 2;
};

/**
 * @param {integer} value Number to be written to buf.
 * @param {integer} [offset=0] Number of bytes to skip before starting to write. Must satisfy 0 <= offset <= buf.length - 2.
 * @returns {integer}
 */
Buffer.prototype.writeInt16LE = function (value, offset = 0) {
	checkOffset(this, offset, 2);
	checkValue(value, -32768, 32767);

	this.setAdjustedIndex(offset, value & 0xFF);
	this.setAdjustedIndex(offset + 1, value >>> 8);

	return offset + 2;
};

/**
 * @param {integer} value Number to be written to buf.
 * @param {integer} [offset=0] Number of bytes to skip before starting to write. Must satisfy 0 <= offset <= buf.length - 4.
 * @returns {integer}
 */
Buffer.prototype.writeInt32BE = function (value, offset = 0) {
	checkOffset(this, offset, 4);
	checkValue(value, -2147483648, 2147483647);

	this.setAdjustedIndex(offset, value >>> 24);
	this.setAdjustedIndex(offset + 1, value >>> 16);
	this.setAdjustedIndex(offset + 2, value >>> 8);
	this.setAdjustedIndex(offset + 3, value & 0xFF);

	return offset + 4;
};

/**
 * @param {integer} value Number to be written to buf.
 * @param {integer} [offset=0] Number of bytes to skip before starting to write. Must satisfy 0 <= offset <= buf.length - 4.
 * @returns {integer}
 */
Buffer.prototype.writeInt32LE = function (value, offset = 0) {
	checkOffset(this, offset, 4);
	checkValue(value, -2147483648, 2147483647);

	this.setAdjustedIndex(offset, value & 0xFF);
	this.setAdjustedIndex(offset + 1, value >>> 8);
	this.setAdjustedIndex(offset + 2, value >>> 16);
	this.setAdjustedIndex(offset + 3, value >>> 24);

	return offset + 4;
};

/**
 * @param {integer} value Number to be written to buf.
 * @param {integer} offset Number of bytes to skip before starting to write. Must satisfy 0 <= offset <= buf.length - byteLength.
 * @param {integer} byteLength Number of bytes to write. Must satisfy 0 < byteLength <= 6.
 * @returns {integer}
 */
Buffer.prototype.writeIntBE = function (value, offset, byteLength) {
	if (byteLength <= 0 || byteLength > 6) {
		throw new RangeError('Index out of range');
	}
	checkOffset(this, offset, byteLength);
	const minMaxBase = Math.pow(2, (8 * byteLength) - 1);
	checkValue(value, -minMaxBase, minMaxBase - 1);

	if (value < 0) {
		value = (minMaxBase * 2) + value;
	}
	let multiplier = 1;
	for (let i = byteLength - 1; i >= 0; i--) {
		let byteValue = (value / multiplier) & 0xFF;
		this.setAdjustedIndex(offset + i, byteValue);
		multiplier *= 0x100;
	}

	return offset + byteLength;
};

/**
 * @param {integer} value Number to be written to buf.
 * @param {integer} offset Number of bytes to skip before starting to write. Must satisfy 0 <= offset <= buf.length - byteLength.
 * @param {integer} byteLength Number of bytes to write. Must satisfy 0 < byteLength <= 6.
 * @returns {integer}
 */
Buffer.prototype.writeIntLE = function (value, offset, byteLength) {
	if (byteLength <= 0 || byteLength > 6) {
		throw new RangeError('Index out of range');
	}
	checkOffset(this, offset, byteLength);
	const minMaxBase = Math.pow(2, (8 * byteLength) - 1);
	checkValue(value, -minMaxBase, minMaxBase - 1);

	if (value < 0) {
		value = (minMaxBase * 2) + value;
	}

	let multiplier = 1;
	for (let i = 0; i < byteLength; i++) {
		let byteValue = (value / multiplier) & 0xFF;
		this.setAdjustedIndex(offset + i, byteValue);
		multiplier *= 0X100;
	}
	return offset + byteLength;
};

/**
 * @param {integer} value Number to be written to buf.
 * @param {integer} [offset=0] Number of bytes to skip before starting to write. Must satisfy 0 <= offset <= buf.length - 1.
 * @returns {integer}
 */
Buffer.prototype.writeUInt8 = function (value, offset = 0) {
	checkOffset(this, offset, 1);
	checkValue(value, 0, 255);

	this.setAdjustedIndex(offset, value);

	return offset + 1;
};

/**
 * @param {integer} value Number to be written to buf.
 * @param {integer} [offset=0] Number of bytes to skip before starting to write. Must satisfy 0 <= offset <= buf.length - 2.
 * @returns {integer}
 */
Buffer.prototype.writeUInt16BE = function (value, offset = 0) {
	checkOffset(this, offset, 2);
	checkValue(value, 0, 65535);

	this.setAdjustedIndex(offset, value >>> 8);
	this.setAdjustedIndex(offset + 1, value & 0xff);

	return offset + 2;
};

/**
 * @param {integer} value Number to be written to buf.
 * @param {integer} [offset=0] Number of bytes to skip before starting to write. Must satisfy 0 <= offset <= buf.length - 2.
 * @returns {integer}
 */
Buffer.prototype.writeUInt16LE = function (value, offset = 0) {
	checkOffset(this, offset, 2);
	checkValue(value, 0, 65535);

	this.setAdjustedIndex(offset, value & 0xff);
	this.setAdjustedIndex(offset + 1, value >>> 8);

	return offset + 2;
};

/**
 * @param {integer} value Number to be written to buf.
 * @param {integer} [offset=0] Number of bytes to skip before starting to write. Must satisfy 0 <= offset <= buf.length - 4.
 * @returns {integer}
 */
Buffer.prototype.writeUInt32BE = function (value, offset = 0) {
	checkOffset(this, offset, 4);
	checkValue(value, 0, 4294967295);

	this.setAdjustedIndex(offset, value >>> 24);
	this.setAdjustedIndex(offset + 1, value >>> 16);
	this.setAdjustedIndex(offset + 2, value >>> 8);
	this.setAdjustedIndex(offset + 3, value & 0xff);

	return offset + 4;
};

/**
 * @param {integer} value Number to be written to buf.
 * @param {integer} [offset=0] Number of bytes to skip before starting to write. Must satisfy 0 <= offset <= buf.length - 4.
 * @returns {integer}
 */
Buffer.prototype.writeUInt32LE = function (value, offset = 0) {
	checkOffset(this, offset, 4);
	checkValue(value, 0, 4294967295);

	this.setAdjustedIndex(offset, value & 0xff);
	this.setAdjustedIndex(offset + 1, value >>> 8);
	this.setAdjustedIndex(offset + 2, value >>> 16);
	this.setAdjustedIndex(offset + 3, value >>> 24);

	return offset + 4;
};

/**
 * @param {integer} value Number to be written to buf.
 * @param {integer} offset Number of bytes to skip before starting to write. Must satisfy 0 <= offset <= buf.length - byteLength.
 * @param {integer} byteLength Number of bytes to write. Must satisfy 0 < byteLength <= 6.
 * @returns {integer}
 */
Buffer.prototype.writeUIntBE = function (value, offset, byteLength) {
	if (byteLength <= 0 || byteLength > 6) {
		throw new RangeError('Index out of range');
	}
	checkOffset(this, offset, byteLength);
	checkValue(value, 0, Math.pow(2, 8 * byteLength) - 1);

	let multiplier = 1;
	for (let i = byteLength - 1; i >= 0; i--) {
		let byteValue = (value / multiplier) & 0xFF;
		this.setAdjustedIndex(offset + i, byteValue);
		multiplier *= 0X100;
	}

	return offset + byteLength;
};

/**
 * @param {integer} value Number to be written to buf.
 * @param {integer} offset Number of bytes to skip before starting to write. Must satisfy 0 <= offset <= buf.length - byteLength.
 * @param {integer} byteLength Number of bytes to write. Must satisfy 0 < byteLength <= 6.
 * @returns {integer}
 */
Buffer.prototype.writeUIntLE = function (value, offset, byteLength) {
	if (byteLength <= 0 || byteLength > 6) {
		throw new RangeError('Index out of range');
	}
	checkOffset(this, offset, byteLength);
	checkValue(value, 0, Math.pow(2, 8 * byteLength) - 1);

	let multiplier = 1;
	for (let i = 0; i < byteLength; i++) {
		let byteValue = (value / multiplier) & 0xFF;
		this.setAdjustedIndex(offset + i, byteValue);
		multiplier *= 0X100;
	}

	return offset + byteLength;
};

// TODO: Implement remaining instance methods:
// buf.lastIndexOf(value[, byteOffset][, encoding])
// buf.readBigInt64BE([offset])
// buf.readBigInt64LE([offset])
// buf.readBigUInt64BE([offset])
// buf.readBigUInt64LE([offset])
// buf.writeBigInt64BE(value[, offset])
// buf.writeBigInt64LE(value[, offset])
// buf.writeBigUInt64BE(value[, offset])
// buf.writeBigUInt64LE(value[, offset])

// FIXME: We need to minimize using a backing Ti.Buffer whenever possible, because
// going back and forth across the bridge for every byte is *very* expensive
// Ideally we should have a "SlowBuffer" that is used when we explicitly wrap a Ti.Buffer
// So that writes are passed through. Otherwise we should avoid using one at all costs
// i.e. when we do Buffer.concat and are only doing reads - why do we need a Ti.Buffer?
// Can we have Ti.Buffer really just wrap a Uint8Array and add it's own methods?
Buffer.allocUnsafe = function (length) {
	return new FastBuffer(length);
};

Buffer.allocUnsafeSlow = function (length) {
	return Buffer.allocUnsafe(length);
};

Buffer.alloc = function (length, fill = 0, encoding = 'utf8') {
	const buf = Buffer.allocUnsafe(length);
	if (fill !== 0) {
		buf.fill(fill, encoding);
	}
	return buf;
};

/**
 * @param {string|Buffer|TypedArray|DataView|ArrayBuffer|SharedArrayBuffer} string original string
 * @param {string} [encoding='utf8'] encoding whose byte length we need to grab
 * @returns {integer}
 */
Buffer.byteLength = function (string, encoding = 'utf8') {
	if (typeof string !== 'string') {
		if (Buffer.isBuffer(string)) {
			return string.length; // return Buffer's length
		}
		return string.byteLength; // TypedArray, ArrayBuffer, SharedArrayBuffer, DataView
	}
	let length = string.length;
	switch (encoding.toLowerCase()) {
		case 'utf8':
		case 'utf-8':
			return utf8ByteLength(string);
		case 'latin1':
		case 'binary':
		case 'ascii':
			return length;
		case 'ucs-2':
		case 'ucs2':
		case 'utf16le':
		case 'utf16-le':
			return 2 * length;
		case 'hex':
			return length / 2;
		case 'base64':
			// Subtract up to two padding chars from end of string!
			if (length > 1 && string.charAt(length - 1) === '=') {
				length--;
			}
			if (length > 1 && string.charAt(length - 1) === '=') {
				length--;
			}
			return Math.floor((length * 3) / 4); // drop fractional value
	}
	return utf8ByteLength(string);
};

Buffer.compare = function (buf1, buf2) {
	if (!Buffer.isBuffer(buf1)) {
		throw new TypeError(`The "buf1" argument must be one of type Buffer or Uint8Array. Received type ${typeof buf1}`);
	}
	// TODO: Wrap UInt8Array args in buffers?
	return buf1.compare(buf2);
};

/**
 * @param {Buffer[]|UInt8Array[]} list list of Buffers to concatenate
 * @param {integer} [totalLength] Total length of the Buffer instances in list when concatenated.
 * @returns {Buffer}
 */
Buffer.concat = function (list, totalLength) {
	if (!Array.isArray(list)) {
		throw new TypeError('list argument must be an Array');
	}
	if (list.length === 0) {
		return new FastBuffer(); // one empty Buffer!
	}
	// allocate one Buffer of `totalLength`? Cap at totalLength?
	if (totalLength === undefined) {
		totalLength = 0;
		// generate the total length from each buffer's length?
		for (let i = 0; i < list.length; i++) {
			totalLength += list[i].length;
		}
	}
	const result = Buffer.allocUnsafe(totalLength);
	let position = 0;
	for (let i = 0; i < list.length; i++) {
		const buf = list[i];
		buf.copy(result, position);
		position += buf.length;
		if (position >= totalLength) {
			break;
		}
	}
	return result;
};

/**
 * @param {string} encoding possible encoding name
 * @returns {boolean}
 */
Buffer.isEncoding = function (encoding) {
	if (typeof encoding !== 'string') {
		return false;
	}
	return VALID_ENCODINGS.includes(encoding.toLowerCase());
};

/**
 * @param {*} obj possible Buffer instance
 * @returns {boolean}
 */
Buffer.isBuffer = function (obj) {
	return obj !== null && obj !== undefined && (obj instanceof Buffer || obj[isBuffer] === true);
};

let INSPECT_MAX_BYTES = 50;
// Override how buffers are presented by util.inspect().
Buffer.prototype[customInspectSymbol] = function (recurseTimes, ctx) {
	const max = INSPECT_MAX_BYTES;
	const actualMax = Math.min(max, this.length);
	const remaining = this.length - max;
	let str = this.slice(0, actualMax).toString('hex').replace(/(.{2})/g, '$1 ').trim();
	if (remaining > 0) {
		str += ` ... ${remaining} more byte${remaining > 1 ? 's' : ''}`;
	}
	// Inspect special properties as well, if possible.
	if (ctx) {
		let extras = false;
		const filter = ctx.showHidden ? ALL_PROPERTIES : ONLY_ENUMERABLE;
		const obj = getOwnNonIndexProperties(this, filter).reduce((obj, key) => {
			extras = true;
			obj[key] = this[key];
			return obj;
		}, Object.create(null));
		if (extras) {
			if (this.length !== 0) {
				str += ', ';
			}
			// '[Object: null prototype] {'.length === 26
			// This is guarded with a test.
			str += utilInspect(obj, {
				...ctx,
				breakLength: Infinity,
				compact: true
			}).slice(27, -2);
		}
	}
	return `<${this.constructor.name} ${str}>`;
};

Buffer.prototype.inspect = Buffer.prototype[customInspectSymbol];

// HACK: ArrayBuffer.isView returns true for Node Buffer, but false for us. Until we can extend Uint8Array, we need to hack this sniffing method
const ArrayBufferIsView = ArrayBuffer.isView;
ArrayBuffer.isView = function (thing) {
	return ArrayBufferIsView(thing) || thing instanceof Buffer;
};

Object.setPrototypeOf(SlowBuffer.prototype, Buffer.prototype);
Object.setPrototypeOf(SlowBuffer, Buffer);

export default {
	Buffer,
	// TODO: Implement transcode()!
	transcode: (_source, _fromEncoding, _toEncoding) => {},
	INSPECT_MAX_BYTES: 50,
	kMaxLength: 2147483647,
	kStringMaxLength: 1073741799,
	constants: {
		MAX_LENGTH: 2147483647,
		MAX_STRING_LENGTH: 1073741799
	}
};

/**
 * Searches a Buffer for the index of a single byte.
 * @param {Buffer} buffer buffer to search
 * @param {integer} singleByte byte we're looking for
 * @param {integer} offset start offset we search at
 * @returns {integer}
 */
function indexOf(buffer, singleByte, offset) {
	const length = buffer.length;
	for (let i = offset; i < length; i++) {
		if (buffer.getAdjustedIndex(i) === singleByte) {
			return i;
		}
	}
	return -1;
}

/**
 * This function explicitly avoids bitwise operations because JS assumes 32-bit sequences for those.
 * It's possible we may be able to use them when byteLength < 4 if that's faster.
 *
 * @param {integer} unsignedValue value before converting back to signed
 * @param {integer} byteLength number of bytes
 * @returns {integer} the signed value that is represented by the unsigned value's bytes
 */
function unsignedToSigned(unsignedValue, byteLength) {
	const bitLength = byteLength * 8;
	const maxPositiveValue = Math.pow(2, bitLength - 1);
	if (unsignedValue < maxPositiveValue) {
		return unsignedValue;
	}
	const maxUnsignedValue = Math.pow(2, bitLength);
	unsignedValue -= maxUnsignedValue;
	return unsignedValue;
}

/**
 * @param {string} string utf-8 string
 * @returns {integer}
 */
function utf8ByteLength(string) {
	// Just convert to a Ti.Buffer and let it tell us the length
	const buf = Ti.createBuffer({ value: string, type: Ti.Codec.CHARSET_UTF8 });
	const length = buf.length;
	buf.release(); // release the buffer since we just needed the length
	return length;
}

/**
 * Throws a RangeError if offset is out of bounds
 * @param {Buffer} buffer buffer we're operating on
 * @param {integer} offset user supplied offset
 * @param {integer} byteLength number of bytes needed in range
 * @throws {RangeError}
 */
function checkOffset(buffer, offset, byteLength) {
	const endOffset = buffer.length - byteLength;
	if (offset < 0 || offset > endOffset) {
		throw new RangeError(`The value of "offset" is out of range. It must be >= 0 and <= ${endOffset}. Received ${offset}`);
	}
}

/**
 * @param {integer} value user-supplied value
 * @param {integer} min minimum valid value
 * @param {integer} max maximum valid value
 * @throws {RangeError}
 */
function checkValue(value, min, max) {
	if (value < min || value > max) {
		throw new RangeError(`The value of "value" is out of range. It must be >= ${min} and <= ${max}. Received ${value}`);
	}
}

let bufferWarningAlreadyEmitted = false;
let nodeModulesCheckCounter = 0;
const bufferWarning = 'Buffer() is deprecated due to security and usability '
											+ 'issues. Please use the Buffer.alloc(), '
											+ 'Buffer.allocUnsafe(), or Buffer.from() methods instead.';

function showFlaggedDeprecation() {
	if (bufferWarningAlreadyEmitted
			|| ++nodeModulesCheckCounter > 10000
			|| isInsideNodeModules()) {
		// We don't emit a warning, because we either:
		// - Already did so, or
		// - Already checked too many times whether a call is coming
		//   from node_modules and want to stop slowing down things, or
		// - The code is inside `node_modules`.
		return;
	}

	process.emitWarning(bufferWarning, 'DeprecationWarning', 'DEP0005');
	bufferWarningAlreadyEmitted = true;
}
