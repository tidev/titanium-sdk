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

import { inspect as utilInspect } from './internal/util/inspect';

const { ALL_PROPERTIES, ONLY_ENUMERABLE } = propertyFilter;

// https://nodejs.org/api/buffer.html#buffer_buffers_and_character_encodings
const TI_CODEC_MAP = new Map();
TI_CODEC_MAP.set('utf-8', Ti.Codec.CHARSET_UTF8);
TI_CODEC_MAP.set('utf8', Ti.Codec.CHARSET_UTF8);
TI_CODEC_MAP.set('utf-16le', Ti.Codec.CHARSET_UTF16LE);
TI_CODEC_MAP.set('utf16le', Ti.Codec.CHARSET_UTF16LE);
TI_CODEC_MAP.set('ucs2', Ti.Codec.CHARSET_UTF16LE);
TI_CODEC_MAP.set('ucs-2', Ti.Codec.CHARSET_UTF16LE);
TI_CODEC_MAP.set('latin1', Ti.Codec.CHARSET_ISO_LATIN_1);
TI_CODEC_MAP.set('binary', Ti.Codec.CHARSET_ISO_LATIN_1);
TI_CODEC_MAP.set('ascii', Ti.Codec.CHARSET_ASCII);
// We have no equivalents of base64 or hex, so we convert them internally here

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

let INSPECT_MAX_BYTES = 50;

class Buffer { // FIXME: Extend Uint8Array
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
	 */
	constructor(arg, encodingOrOffset, length) {
		// FIXME: Split into Fast/SlowBuffer. Have SlowBuffer wrap an existing Ti.Buffer
		// Have FastBuffer just be an extension of Uint8Array
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

		const tiBuffer = arg;
		let start = encodingOrOffset;
		if (start === undefined) {
			start = 0;
		}
		if (length === undefined) {
			length = tiBuffer.length - start;
		}
		Object.defineProperties(this, {
			byteOffset: {
				value: start
			},
			length: {
				value: length
			},
			_tiBuffer: {
				value: tiBuffer
			}
		});
	}

	// This is a method we should get by extending Uint8Array, so really should only be overriden on a "SlowBuffer" that wraps Ti.Buffer
	get buffer() {
		// Get the slice of the array from byteOffset to length
		return Uint8Array.from(this).buffer;
	}

	// This is a method we should get by extending Uint8Array, so really should only be overriden on a "SlowBuffer" that wraps Ti.Buffer
	set(src, offset = 0) {
		const numBytes = src.length;
		// check src.length + offset doesn't go beyond our length!
		checkOffset(this, offset, numBytes);
		// copy src values into this buffer starting at offset
		for (let i = 0; i < numBytes; i++) {
			setAdjustedIndex(this, i + offset, src[i]);
		}
	}

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
	compare(target, targetStart, targetEnd, sourceStart, sourceEnd) {
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
			const targetValue = getAdjustedIndex(dest, i);
			const sourceValue = getAdjustedIndex(source, i);
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
	}

	/**
	 * Copies from this to target
	 * @param {Buffer} target destination we're copying into
	 * @param {integer} [targetStart=0] start index to copy into in destination Buffer
	 * @param {integer} [sourceStart=0] start index to copy from within `this`
	 * @param {integer} [sourceEnd=this.length] end index to copy from within `this`
	 * @returns {integer} number of bytes copied
	 */
	copy(target, targetStart, sourceStart, sourceEnd) {
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
			length = remaining;
		}

		// TODO: handle overlap when target === this!
		// TODO: Do we need to take target byteOffset into account here?
		target._tiBuffer.copy(this._tiBuffer, targetStart, sourceStart + this.byteOffset, length);
		return length;
	}

	/**
	 * Creates and returns an iterator of [index, byte] pairs from the contents of buf.
	 * @returns {Iterator}
	 */
	entries() {
		const buffer = this;
		let nextIndex = 0;
		const end = this.length;
		const entryIterator = {
			next: function () {
				if (nextIndex < end) {
					const result = { value: [ nextIndex, getAdjustedIndex(buffer, nextIndex) ], done: false };
					nextIndex++;
					return result;
				}
				return { value: undefined, done: true };
			},
			[Symbol.iterator]: function () { return this; }
		};
		return entryIterator;
	}

	equals(otherBuffer) {
		if (!Buffer.isBuffer(otherBuffer)) {
			throw new TypeError('argument must be a Buffer');
		}
		if (otherBuffer === this) {
			return true;
		}
		return this.compare(otherBuffer) === 0;
	}

	/**
	 * @param {string|Buffer|UInt8Array|integer} value The value with which to fill `buf`.
	 * @param {integer} [offset=0] Number of bytes to skip before starting to fill `buf`
	 * @param {integer} [end] Where to stop filling buf (not inclusive). `buf.length` by default
	 * @param {string} [encoding='utf8'] The encoding for `value` if `value` is a string.
	 * @returns {this}
	 */
	fill(value, offset, end, encoding) {
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

		const valueType = typeof value;
		if (valueType === 'string') {
			const bufToFillWith = Buffer.from(value, encoding);
			const fillBufLength = bufToFillWith.length;
			if (fillBufLength === 0) {
				throw new Error('no valid fill data');
			}
			// If the buffer length === 1, we can just do this._tiBuffer.fill(value, offset, end);
			if (fillBufLength === 1) {
				this._tiBuffer.fill(bufToFillWith._tiBuffer[0], offset, end);
				return this;
			}

			// multiple byte fill!
			const length = end - offset;
			for (let i = 0; i < length; i++) {
				// TODO: Do we need to account for byteOffset here (on `this`, not on the buffer we just created)?
				const fillChar = bufToFillWith._tiBuffer[i % fillBufLength];
				this._tiBuffer[i + offset] = fillChar;
			}
			return this;
		}

		// if the value is a number (or a buffer with a single byte) we can use tiBuffer.fill();
		this._tiBuffer.fill(value, offset, end);
		return this;
	}

	includes(value, byteOffset, encoding) {
		return this.indexOf(value, byteOffset, encoding) !== -1;
	}

	/**
	 * @param {string|Buffer|integer} value What to search for
	 * @param {integer} [byteOffset=0] Where to begin searching in buf. If negative, then offset is calculated from the end of buf
	 * @param {string} [encoding='utf8'] If value is a string, this is the encoding used to determine the binary representation of the string that will be searched for in buf
	 * @returns {integer} The index of the first occurrence of value in buf, or -1 if buf does not contain value.
	 */
	indexOf(value, byteOffset, encoding) {
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
			value = Buffer.from(value, encoding);
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
	}

	keys() {
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
	}

	/**
	 * @param {integer} [offset=0] Number of bytes to skip before starting to read. Must satisfy 0 <= offset <= buf.length - 8
	 * @returns {double} Reads a 64-bit double from buf at the specified offset with specified endian format
	 */
	readDoubleBE(offset = 0) {
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
	}

	/**
	 * @param {integer} [offset=0] Number of bytes to skip before starting to read. Must satisfy 0 <= offset <= buf.length - 8
	 * @returns {double} Reads a 64-bit double from buf at the specified offset with specified endian format
	 */
	readDoubleLE(offset = 0) {
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
	}

	/**
	 * @param {integer} [offset=0] Number of bytes to skip before starting to read. Must satisfy 0 <= offset <= buf.length - 4
	 * @returns {float} Reads a 32-bit float from buf at the specified offset with specified endian format
	 */
	readFloatBE(offset = 0) {
		checkOffset(this, offset, 4);

		// Node cheats and uses a Float32Array and UInt8Array backed by the same buffer
		// so basically it reads in the bytes stuffing them into Uint8Array, then returns the value from the Float32Array
		// FIXME: This assumes LE system byteOrder
		uint8FloatArray[3] = this[offset++];
		uint8FloatArray[2] = this[offset++];
		uint8FloatArray[1] = this[offset++];
		uint8FloatArray[0] = this[offset++];
		return floatArray[0];
	}

	/**
	 * @param {integer} [offset=0] Number of bytes to skip before starting to read. Must satisfy 0 <= offset <= buf.length - 4
	 * @returns {float} Reads a 32-bit float from buf at the specified offset with specified endian format
	 */
	readFloatLE(offset = 0) {
		checkOffset(this, offset, 4);

		// Node cheats and uses a Float32Array and UInt8Array backed by the same buffer
		// so basically it reads in the bytes stuffing them into Uint8Array, then returns the value from the Float32Array
		// FIXME: This assumes LE system byteOrder
		uint8FloatArray[0] = this[offset++];
		uint8FloatArray[1] = this[offset++];
		uint8FloatArray[2] = this[offset++];
		uint8FloatArray[3] = this[offset++];
		return floatArray[0];
	}

	/**
	 * @param {integer} [offset=0] Number of bytes to skip before starting to read. Must satisfy 0 <= offset <= buf.length - 1.
	 * @returns {integer}
	 */
	readInt8(offset = 0) {
		const unsignedValue = this.readUInt8(offset);
		return unsignedToSigned(unsignedValue, 1);
	}

	/**
	 * @param {integer} [offset=0] Number of bytes to skip before starting to read. Must satisfy 0 <= offset <= buf.length - 2.
	 * @returns {integer}
	 */
	readInt16BE(offset) {
		const unsignedValue = this.readUInt16BE(offset);
		return unsignedToSigned(unsignedValue, 2);
	}

	/**
	 * @param {integer} [offset=0] Number of bytes to skip before starting to read. Must satisfy 0 <= offset <= buf.length - 2.
	 * @returns {integer}
	 */
	readInt16LE(offset = 0) {
		const unsignedValue = this.readUInt16LE(offset);
		return unsignedToSigned(unsignedValue, 2);
	}

	/**
	 * @param {integer} [offset=0] Number of bytes to skip before starting to read. Must satisfy 0 <= offset <= buf.length - 4.
	 * @returns {integer}
	 */
	readInt32BE(offset = 0) {
		const unsignedValue = this.readUInt32BE(offset);
		return unsignedToSigned(unsignedValue, 4);
	}

	/**
	 * @param {integer} [offset=0] Number of bytes to skip before starting to read. Must satisfy 0 <= offset <= buf.length - 4.
	 * @returns {integer}
	 */
	readInt32LE(offset = 0) {
		const unsignedValue = this.readUInt32LE(offset);
		return unsignedToSigned(unsignedValue, 4);
	}

	/**
	 * Reads byteLength number of bytes from buf at the specified offset and interprets the result as a two's complement signed value. Supports up to 48 bits of accuracy.
	 * @param {integer} offset Number of bytes to skip before starting to read. Must satisfy 0 <= offset <= buf.length - byteLength.
	 * @param {integer} byteLength umber of bytes to read. Must satisfy 0 < byteLength <= 6.
	 * @returns {integer}
	 */
	readIntBE(offset, byteLength) {
		const unsignedValue = this.readUIntBE(offset, byteLength);
		return unsignedToSigned(unsignedValue, byteLength);
	}

	/**
	 * Reads byteLength number of bytes from buf at the specified offset and interprets the result as a two's complement signed value. Supports up to 48 bits of accuracy.
	 * @param {integer} offset Number of bytes to skip before starting to read. Must satisfy 0 <= offset <= buf.length - byteLength.
	 * @param {integer} byteLength umber of bytes to read. Must satisfy 0 < byteLength <= 6.
	 * @returns {integer}
	 */
	readIntLE(offset, byteLength) {
		const unsignedValue = this.readUIntLE(offset, byteLength);
		return unsignedToSigned(unsignedValue, byteLength);
	}

	/**
	 * @param {integer} [offset=0] Number of bytes to skip before starting to read. Must satisfy 0 <= offset <= buf.length - 1.
	 * @returns {integer}
	 */
	readUInt8(offset = 0) {
		checkOffset(this, offset, 1);
		return this[offset];
	}

	/**
	 * @param {integer} [offset=0] Number of bytes to skip before starting to read. Must satisfy 0 <= offset <= buf.length - 2.
	 * @returns {integer}
	 */
	readUInt16BE(offset = 0) {
		checkOffset(this, offset, 2);
		// first byte shifted and OR'd with second byte
		return (this[offset] << 8) | this[offset + 1];
	}

	/**
	 * @param {integer} [offset=0] Number of bytes to skip before starting to read. Must satisfy 0 <= offset <= buf.length - 2.
	 * @returns {integer}
	 */
	readUInt16LE(offset = 0) {
		checkOffset(this, offset, 2);
		// first byte OR'd with second byte shifted
		return this[offset] | (this[offset + 1] << 8);
	}

	/**
	 * @param {integer} [offset=0] Number of bytes to skip before starting to read. Must satisfy 0 <= offset <= buf.length - 4.
	 * @returns {integer}
	 */
	readUInt32BE(offset = 0) {
		checkOffset(this, offset, 4);
		return (this[offset] * 0x1000000) + ((this[offset + 1] << 16) | (this[offset + 2] << 8) | this[offset + 3]);
		// rather than shifting by << 24, multiply the first byte and add it in so we don't retain the "sign bit"
		// (because bit-wise operators assume a 32-bit number)
	}

	/**
	 * @param {integer} [offset=0] Number of bytes to skip before starting to read. Must satisfy 0 <= offset <= buf.length - 4.
	 * @returns {integer}
	 */
	readUInt32LE(offset = 0) {
		checkOffset(this, offset, 4);
		return (this[offset] | (this[offset + 1] << 8) | (this[offset + 2] << 16)) + (this[offset + 3] * 0x1000000);
		// rather than shifting by << 24, multiply the last byte and add it in so we don't retain the "sign bit"
	}

	/**
	 * @param {integer} offset Number of bytes to skip before starting to read. Must satisfy 0 <= offset <= buf.length - byteLength.
	 * @param {integer} byteLength Number of bytes to read. Must satisfy 0 < byteLength <= 6.
	 * @returns {integer}
	 */
	readUIntBE(offset, byteLength) {
		if (byteLength <= 0 || byteLength > 6) {
			throw new RangeError('Index out of range');
		}
		checkOffset(this, offset, byteLength);

		let result = 0;
		let multiplier = 1; // we use a multipler for each byte
		// we're doing the same loop as #readUIntLE, just backwards!
		for (let i = byteLength - 1; i >= 0; i--) {
			result += getAdjustedIndex(this, offset + i) * multiplier;
			multiplier *= 0x100; // move multiplier to next byte
		}
		return result;
	}

	/**
	 * @param {integer} offset Number of bytes to skip before starting to read. Must satisfy 0 <= offset <= buf.length - byteLength.
	 * @param {integer} byteLength Number of bytes to read. Must satisfy 0 < byteLength <= 6.
	 * @returns {integer}
	 */
	readUIntLE(offset, byteLength) {
		if (byteLength <= 0 || byteLength > 6) {
			throw new RangeError('Index out of range');
		}
		checkOffset(this, offset, byteLength);

		let result = 0;
		let multiplier = 1; // we use a multipler for each byte
		for (let i = 0; i < byteLength; i++) {
			result += getAdjustedIndex(this, offset + i) * multiplier;
			multiplier *= 0x100; // move multiplier to next byte
		}
		return result;
	}

	/**
	 * @param {integer} [start=0] Where the new `Buffer` will start.
	 * @param {integer} [end=this.length] Where the new Buffer will end (not inclusive). Default: `buf.length`.
	 * @returns {Buffer}
	 */
	slice(start, end) {
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
		// Wrap the same Ti.Buffer object but specify the start/end to "crop" with
		return newBuffer(this._tiBuffer, this.byteOffset + start, length);
	}

	/**
	 * @param {integer} [start=0] Where the new `Buffer` will start.
	 * @param {integer} [end=this.length] Where the new Buffer will end (not inclusive). Default: `buf.length`.
	 * @returns {Buffer}
	 */
	subarray(start, end) {
		return this.slice(start, end);
	}

	/**
	 * Interprets buf as an array of unsigned 16-bit integers and swaps the byte order in-place.
	 * Throws ERR_INVALID_BUFFER_SIZE if buf.length is not a multiple of 2.
	 * @returns {Buffer}
	 */
	swap16() {
		const length = this.length;
		if (length % 2 !== 0) {
			throw new RangeError('Buffer size must be a multiple of 16-bits');
		}
		for (let i = 0; i < length; i += 2) {
			const first = getAdjustedIndex(this, i);
			const second = getAdjustedIndex(this, i + 1);
			setAdjustedIndex(this, i, second);
			setAdjustedIndex(this, i + 1, first);
		}
		return this;
	}

	/**
	 * Interprets buf as an array of unsigned 32-bit integers and swaps the byte order in-place.
	 * Throws ERR_INVALID_BUFFER_SIZE if buf.length is not a multiple of 4.
	 * @returns {Buffer}
	 */
	swap32() {
		const length = this.length;
		if (length % 4 !== 0) {
			throw new RangeError('Buffer size must be a multiple of 32-bits');
		}
		for (let i = 0; i < length; i += 4) {
			const first = getAdjustedIndex(this, i);
			const second = getAdjustedIndex(this, i + 1);
			const third = getAdjustedIndex(this, i + 2);
			const fourth = getAdjustedIndex(this, i + 3);
			setAdjustedIndex(this, i, fourth);
			setAdjustedIndex(this, i + 1, third);
			setAdjustedIndex(this, i + 2, second);
			setAdjustedIndex(this, i + 3, first);
		}
		return this;
	}

	/**
	 * Interprets buf as an array of unsigned 64-bit integers and swaps the byte order in-place.
	 * Throws ERR_INVALID_BUFFER_SIZE if buf.length is not a multiple of 8.
	 * @returns {Buffer}
	 */
	swap64() {
		const length = this.length;
		if (length % 8 !== 0) {
			throw new RangeError('Buffer size must be a multiple of 64-bits');
		}
		for (let i = 0; i < length; i += 8) {
			const first = getAdjustedIndex(this, i);
			const second = getAdjustedIndex(this, i + 1);
			const third = getAdjustedIndex(this, i + 2);
			const fourth = getAdjustedIndex(this, i + 3);
			const fifth = getAdjustedIndex(this, i + 4);
			const sixth = getAdjustedIndex(this, i + 5);
			const seventh = getAdjustedIndex(this, i + 6);
			const eighth = getAdjustedIndex(this, i + 7);
			setAdjustedIndex(this, i, eighth);
			setAdjustedIndex(this, i + 1, seventh);
			setAdjustedIndex(this, i + 2, sixth);
			setAdjustedIndex(this, i + 3, fifth);
			setAdjustedIndex(this, i + 4, fourth);
			setAdjustedIndex(this, i + 5, third);
			setAdjustedIndex(this, i + 6, second);
			setAdjustedIndex(this, i + 7, first);
		}
		return this;
	}

	/**
	 * @returns {object}
	 */
	toJSON() {
		return {
			type: 'Buffer',
			// Take advantage of slice working on "Array-like" objects (juts like `arguments`)
			// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice#Array-like_objects
			data: [].slice.call(this)
		};
	}

	/**
	 * @param {string} [encoding='utf8'] The character encoding to use
	 * @param {integer} [start=0] The byte offset to start decoding at
	 * @param {integer} [end] The byte offset to stop decoding at (not inclusive). `buf.length` default
	 * @returns {string}
	 */
	toString(encoding, start, end) {
		// fast case of no args
		if (arguments.length === 0) {
			return this._tiBuffer.toString();
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
			// if this is the original underlying buffer just return it's toString() value
			if (this.byteOffset === 0 && this.length === this._tiBuffer.length) {
				return this._tiBuffer.toString(); // we return utf-8 by default natively
			}
			// if we're offset or cropping in nay way, clone the range and return that buffer's toString()
			return this._tiBuffer.clone(this.byteOffset, this.length).toString();
		}

		if (encoding === 'base64') {
			let blob;
			// if this is the original underlying buffer just return it's toString() value
			if (this.byteOffset === 0 && this.length === this._tiBuffer.length) {
				blob = Ti.Utils.base64encode(this._tiBuffer.toBlob());
			} else {
				// if we're offset or cropping in any way, clone the range and return that buffer's toString()
				blob = Ti.Utils.base64encode(this._tiBuffer.clone(this.byteOffset, this.length).toBlob());
			}
			return blob.toString();
		}

		if (encoding === 'hex') {
			let hexStr = '';
			for (let i = 0; i < length; i++) {
				// each one is a "byte"
				let hex = (getAdjustedIndex(this, i) & 0xff).toString(16);
				hex = (hex.length === 1) ? '0' + hex : hex;
				hexStr += hex;
			}
			return hexStr;
		}

		if (encoding === 'latin1' || encoding === 'binary') {
			let latin1String = '';
			for (let i = 0; i < length; i++) {
				// each one is a "byte"
				latin1String += String.fromCharCode(getAdjustedIndex(this, i));
			}
			return latin1String;
		}

		if (encoding === 'ascii') {
			let ascii = '';
			for (let i = 0; i < length; i++) {
				// we store bytes (8-bit), but ascii is 7-bit. Node "masks" the last bit off, so let's do the same
				ascii += String.fromCharCode(getAdjustedIndex(this, i) & 0x7F);
			}
			return ascii;
		}

		// UCS2/UTF16
		return bufferToUTF16String(this._tiBuffer, this.byteOffset, this.length);
	}

	/**
	 * Provides a conversion method for interacting with Ti APIs taht require a Ti.Buffer
	 * @returns {Ti.Buffer} the underlying Ti.Buffer backing this Buffer instance
	 */
	toTiBuffer() {
		return this._tiBuffer;
	}

	/**
	 * Creates and returns an iterator for buf values (bytes)
	 * @returns {Iterator}
	 */
	values() {
		const buffer = this;
		let nextIndex = 0;
		const end = this.length;
		const myIterator = {
			next: function () {
				if (nextIndex < end) {
					const result = { value: getAdjustedIndex(buffer, nextIndex), done: false };
					nextIndex++;
					return result;
				}
				return { value: undefined, done: true };
			},
			[Symbol.iterator]: function () { return this; }
		};
		return myIterator;
	}

	/**
	 * Called when buffer is used in a for..of loop. Delegates to #values()
	 * @returns {Iterator}
	 */
	[Symbol.iterator]() {
		return this.values();
	}

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
	write(string, offset, length, encoding) {
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
		const src = Buffer.from(string, encoding); // FIXME: Can we let it know to only convert `remaining` bytes?

		// then stick that into our buffer starting at `offset`!
		return copyBuffer(src._tiBuffer, this._tiBuffer, offset, length);
	}

	writeDoubleBE(value, offset = 0) {
		checkOffset(this, offset, 8);

		doubleArray[0] = value;
		setAdjustedIndex(this, offset++, uint8DoubleArray[7]);
		setAdjustedIndex(this, offset++, uint8DoubleArray[6]);
		setAdjustedIndex(this, offset++, uint8DoubleArray[5]);
		setAdjustedIndex(this, offset++, uint8DoubleArray[4]);
		setAdjustedIndex(this, offset++, uint8DoubleArray[3]);
		setAdjustedIndex(this, offset++, uint8DoubleArray[2]);
		setAdjustedIndex(this, offset++, uint8DoubleArray[1]);
		setAdjustedIndex(this, offset++, uint8DoubleArray[0]);

		return offset; // at this point, we should have already added 8 to offset
	}

	writeDoubleLE(value, offset = 0) {
		checkOffset(this, offset, 8);

		doubleArray[0] = value;
		setAdjustedIndex(this, offset++, uint8DoubleArray[0]);
		setAdjustedIndex(this, offset++, uint8DoubleArray[1]);
		setAdjustedIndex(this, offset++, uint8DoubleArray[2]);
		setAdjustedIndex(this, offset++, uint8DoubleArray[3]);
		setAdjustedIndex(this, offset++, uint8DoubleArray[4]);
		setAdjustedIndex(this, offset++, uint8DoubleArray[5]);
		setAdjustedIndex(this, offset++, uint8DoubleArray[6]);
		setAdjustedIndex(this, offset++, uint8DoubleArray[7]);

		return offset; // at this point, we should have already added 8 to offset
	}

	writeFloatBE(value, offset = 0) {
		checkOffset(this, offset, 4);

		floatArray[0] = value;
		setAdjustedIndex(this, offset++, uint8FloatArray[3]);
		setAdjustedIndex(this, offset++, uint8FloatArray[2]);
		setAdjustedIndex(this, offset++, uint8FloatArray[1]);
		setAdjustedIndex(this, offset++, uint8FloatArray[0]);

		return offset; // at this point, we should have already added 4 to offset
	}

	writeFloatLE(value, offset = 0) {
		checkOffset(this, offset, 4);

		floatArray[0] = value;
		setAdjustedIndex(this, offset++, uint8FloatArray[0]);
		setAdjustedIndex(this, offset++, uint8FloatArray[1]);
		setAdjustedIndex(this, offset++, uint8FloatArray[2]);
		setAdjustedIndex(this, offset++, uint8FloatArray[3]);

		return offset; // at this point, we should have already added 4 to offset
	}

	/**
	 * @param {integer} value Number to be written to buf.
	 * @param {integer} [offset=0] Number of bytes to skip before starting to write. Must satisfy 0 <= offset <= buf.length - 1.
	 * @returns {integer}
	 */
	writeInt8(value, offset = 0) {
		checkOffset(this, offset, 1);
		checkValue(value, -128, 127);

		if (value >= 0) {
			// just write it normally
			setAdjustedIndex(this, offset, value);
		} else {
			// convert from signed to 2's complement bits
			setAdjustedIndex(this, offset, (0xFF + value) + 1); // max value, plus the negative number, add one
		}

		return offset + 1;
	}

	/**
	 * @param {integer} value Number to be written to buf.
	 * @param {integer} [offset=0] Number of bytes to skip before starting to write. Must satisfy 0 <= offset <= buf.length - 2.
	 * @returns {integer}
	 */
	writeInt16BE(value, offset = 0) {
		checkOffset(this, offset, 2);
		checkValue(value, -32768, 32767);

		setAdjustedIndex(this, offset, value >>> 8); // just shift over a byte
		setAdjustedIndex(this, offset + 1, value & 0xFF); // mask to first byte

		return offset + 2;
	}

	/**
	 * @param {integer} value Number to be written to buf.
	 * @param {integer} [offset=0] Number of bytes to skip before starting to write. Must satisfy 0 <= offset <= buf.length - 2.
	 * @returns {integer}
	 */
	writeInt16LE(value, offset = 0) {
		checkOffset(this, offset, 2);
		checkValue(value, -32768, 32767);

		setAdjustedIndex(this, offset, value & 0xFF);
		setAdjustedIndex(this, offset + 1, value >>> 8);

		return offset + 2;
	}

	/**
	 * @param {integer} value Number to be written to buf.
	 * @param {integer} [offset=0] Number of bytes to skip before starting to write. Must satisfy 0 <= offset <= buf.length - 4.
	 * @returns {integer}
	 */
	writeInt32BE(value, offset = 0) {
		checkOffset(this, offset, 4);
		checkValue(value, -2147483648, 2147483647);

		setAdjustedIndex(this, offset, value >>> 24);
		setAdjustedIndex(this, offset + 1, value >>> 16);
		setAdjustedIndex(this, offset + 2, value >>> 8);
		setAdjustedIndex(this, offset + 3, value & 0xFF);

		return offset + 4;
	}

	/**
	 * @param {integer} value Number to be written to buf.
	 * @param {integer} [offset=0] Number of bytes to skip before starting to write. Must satisfy 0 <= offset <= buf.length - 4.
	 * @returns {integer}
	 */
	writeInt32LE(value, offset = 0) {
		checkOffset(this, offset, 4);
		checkValue(value, -2147483648, 2147483647);

		setAdjustedIndex(this, offset, value & 0xFF);
		setAdjustedIndex(this, offset + 1, value >>> 8);
		setAdjustedIndex(this, offset + 2, value >>> 16);
		setAdjustedIndex(this, offset + 3, value >>> 24);

		return offset + 4;
	}

	/**
	 * @param {integer} value Number to be written to buf.
	 * @param {integer} offset Number of bytes to skip before starting to write. Must satisfy 0 <= offset <= buf.length - byteLength.
	 * @param {integer} byteLength Number of bytes to write. Must satisfy 0 < byteLength <= 6.
	 * @returns {integer}
	 */
	writeIntBE(value, offset, byteLength) {
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
			setAdjustedIndex(this, offset + i, byteValue);
			multiplier *= 0x100;
		}

		return offset + byteLength;
	}

	/**
	 * @param {integer} value Number to be written to buf.
	 * @param {integer} offset Number of bytes to skip before starting to write. Must satisfy 0 <= offset <= buf.length - byteLength.
	 * @param {integer} byteLength Number of bytes to write. Must satisfy 0 < byteLength <= 6.
	 * @returns {integer}
	 */
	writeIntLE(value, offset, byteLength) {
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
			setAdjustedIndex(this, offset + i, byteValue);
			multiplier *= 0X100;
		}
		return offset + byteLength;
	}

	/**
	 * @param {integer} value Number to be written to buf.
	 * @param {integer} [offset=0] Number of bytes to skip before starting to write. Must satisfy 0 <= offset <= buf.length - 1.
	 * @returns {integer}
	 */
	writeUInt8(value, offset = 0) {
		checkOffset(this, offset, 1);
		checkValue(value, 0, 255);

		setAdjustedIndex(this, offset, value);

		return offset + 1;
	}

	/**
	 * @param {integer} value Number to be written to buf.
	 * @param {integer} [offset=0] Number of bytes to skip before starting to write. Must satisfy 0 <= offset <= buf.length - 2.
	 * @returns {integer}
	 */
	writeUInt16BE(value, offset = 0) {
		checkOffset(this, offset, 2);
		checkValue(value, 0, 65535);

		setAdjustedIndex(this, offset, value >>> 8);
		setAdjustedIndex(this, offset + 1, value & 0xff);

		return offset + 2;
	}

	/**
	 * @param {integer} value Number to be written to buf.
	 * @param {integer} [offset=0] Number of bytes to skip before starting to write. Must satisfy 0 <= offset <= buf.length - 2.
	 * @returns {integer}
	 */
	writeUInt16LE(value, offset = 0) {
		checkOffset(this, offset, 2);
		checkValue(value, 0, 65535);

		setAdjustedIndex(this, offset, value & 0xff);
		setAdjustedIndex(this, offset + 1, value >>> 8);

		return offset + 2;
	}

	/**
	 * @param {integer} value Number to be written to buf.
	 * @param {integer} [offset=0] Number of bytes to skip before starting to write. Must satisfy 0 <= offset <= buf.length - 4.
	 * @returns {integer}
	 */
	writeUInt32BE(value, offset = 0) {
		checkOffset(this, offset, 4);
		checkValue(value, 0, 4294967295);

		setAdjustedIndex(this, offset, value >>> 24);
		setAdjustedIndex(this, offset + 1, value >>> 16);
		setAdjustedIndex(this, offset + 2, value >>> 8);
		setAdjustedIndex(this, offset + 3, value & 0xff);

		return offset + 4;
	}

	/**
	 * @param {integer} value Number to be written to buf.
	 * @param {integer} [offset=0] Number of bytes to skip before starting to write. Must satisfy 0 <= offset <= buf.length - 4.
	 * @returns {integer}
	 */
	writeUInt32LE(value, offset = 0) {
		checkOffset(this, offset, 4);
		checkValue(value, 0, 4294967295);

		setAdjustedIndex(this, offset, value & 0xff);
		setAdjustedIndex(this, offset + 1, value >>> 8);
		setAdjustedIndex(this, offset + 2, value >>> 16);
		setAdjustedIndex(this, offset + 3, value >>> 24);

		return offset + 4;
	}

	/**
	 * @param {integer} value Number to be written to buf.
	 * @param {integer} offset Number of bytes to skip before starting to write. Must satisfy 0 <= offset <= buf.length - byteLength.
	 * @param {integer} byteLength Number of bytes to write. Must satisfy 0 < byteLength <= 6.
	 * @returns {integer}
	 */
	writeUIntBE(value, offset, byteLength) {
		if (byteLength <= 0 || byteLength > 6) {
			throw new RangeError('Index out of range');
		}
		checkOffset(this, offset, byteLength);
		checkValue(value, 0, Math.pow(2, 8 * byteLength) - 1);

		let multiplier = 1;
		for (let i = byteLength - 1; i >= 0; i--) {
			let byteValue = (value / multiplier) & 0xFF;
			setAdjustedIndex(this, offset + i, byteValue);
			multiplier *= 0X100;
		}

		return offset + byteLength;
	}

	/**
	 * @param {integer} value Number to be written to buf.
	 * @param {integer} offset Number of bytes to skip before starting to write. Must satisfy 0 <= offset <= buf.length - byteLength.
	 * @param {integer} byteLength Number of bytes to write. Must satisfy 0 < byteLength <= 6.
	 * @returns {integer}
	 */
	writeUIntLE(value, offset, byteLength) {
		if (byteLength <= 0 || byteLength > 6) {
			throw new RangeError('Index out of range');
		}
		checkOffset(this, offset, byteLength);
		checkValue(value, 0, Math.pow(2, 8 * byteLength) - 1);

		let multiplier = 1;
		for (let i = 0; i < byteLength; i++) {
			let byteValue = (value / multiplier) & 0xFF;
			setAdjustedIndex(this, offset + i, byteValue);
			multiplier *= 0X100;
		}

		return offset + byteLength;
	}

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

	static allocUnsafe(length) {
		return newBuffer(Ti.createBuffer({ length }));
	}

	static allocUnsafeSlow(length) {
		return Buffer.allocUnsafe(length);
	}

	static alloc(length, fill = 0, encoding = 'utf8') {
		const buf = Buffer.allocUnsafe(length);
		buf.fill(fill, encoding);
		return buf;
	}

	/**
	 * @param {string|Buffer|TypedArray|DataView|ArrayBuffer|SharedArrayBuffer} string original string
	 * @param {string} [encoding='utf8'] encoding whose byte length we need to grab
	 * @returns {integer}
	 */
	static byteLength(string, encoding = 'utf8') {
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
	}

	static compare(buf1, buf2) {
		if (!Buffer.isBuffer(buf1)) {
			throw new TypeError(`The "buf1" argument must be one of type Buffer or Uint8Array. Received type ${typeof buf1}`);
		}
		// TODO: Wrap UInt8Array args in buffers?
		return buf1.compare(buf2);
	}

	/**
	 * @param {Buffer[]|UInt8Array[]} list list of Buffers to concatenate
	 * @param {integer} [totalLength] Total length of the Buffer instances in list when concatenated.
	 * @returns {Buffer}
	 */
	static concat(list, totalLength) {
		if (!Array.isArray(list)) {
			throw new TypeError('list argument must be an Array');
		}
		if (list.length === 0) {
			return Buffer.alloc(0); // one empty Buffer!
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
	}

	/**
	 * @param {integer[]|Buffer|string} value value we're wrapping
	 * @param {string} [encoding='utf8'] The encoding of string.
	 * @returns {Buffer}
	 */
	static from(value, encoding = 'utf8') {
		const valueType = typeof value;
		if (valueType === 'string') {
			if (!Buffer.isEncoding(encoding)) {
				throw new TypeError(`Unknown encoding: ${encoding}`);
			}
			encoding = encoding.toLowerCase();
			if (encoding === 'base64') {
				const blob = Ti.Utils.base64decode(value);
				const blobStream = Ti.Stream.createStream({ source: blob, mode: Ti.Stream.MODE_READ });
				const buffer = Ti.Stream.readAll(blobStream);
				blobStream.close();
				return newBuffer(buffer);
			}
			if (encoding === 'hex') {
				return Buffer.from(stringToHexBytes(value));
			}
			return newBuffer(Ti.createBuffer({ value: value, type: getTiCodecCharset(encoding) }));
		} else if (valueType === 'object') {
			if (Buffer.isBuffer(value)) {
				const length = value.length;
				const buffer = Buffer.allocUnsafe(length);

				if (length === 0) {
					return buffer;
				}

				value.copy(buffer, 0, 0, length);
				return buffer;
			}
			if (Array.isArray(value) || value instanceof Uint8Array) {
				const length = value.length;
				if (length === 0) {
					return Buffer.allocUnsafe(0);
				}

				const tiBuffer = Ti.createBuffer({ length });
				for (let i = 0; i < length; i++) {
					tiBuffer[i] = value[i] & 0xFF; // mask to one byte
				}

				return newBuffer(tiBuffer);
			}
			if (value.apiName && value.apiName === 'Ti.Buffer') {
				return newBuffer(value);
			}
		}
		throw new TypeError('The \'value\' argument must be one of type: \'string\', \'Array\', \'Buffer\', \'Ti.Buffer\'');
	}

	/**
	 * @param {string} encoding possible encoding name
	 * @returns {boolean}
	 */
	static isEncoding(encoding) {
		if (typeof encoding !== 'string') {
			return false;
		}
		return VALID_ENCODINGS.includes(encoding.toLowerCase());
	}

	/**
	 * @param {*} obj possible Buffer instance
	 * @returns {boolean}
	 */
	static isBuffer(obj) {
		return obj !== null && obj !== undefined && obj[isBuffer] === true;
	}

	// Override how buffers are presented by util.inspect().
	[customInspectSymbol](recurseTimes, ctx) {
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
	}
}

Buffer.prototype.inspect = Buffer.prototype[customInspectSymbol];

Buffer.poolSize = 8192;

// HACK: ArrayBuffer.isView returns true for Node Buffer, but false for us. Until we can extend Uint8Array, we need to hack this sniffing method
const ArrayBufferIsView = ArrayBuffer.isView;
ArrayBuffer.isView = function (thing) {
	return ArrayBufferIsView(thing) || thing instanceof Buffer;
};
Object.setPrototypeOf(Buffer, Uint8Array);

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
		if (getAdjustedIndex(buffer, i) === singleByte) {
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
 * @param {Ti.Buffer} src source Buffer we're copying from
 * @param {Ti.Buffer} dest destination Buffer we're copying into
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
 * @param {string} encoding desired encoding name
 * @returns {integer} Ti.Codec constant that maps to the encoding
 */
function getTiCodecCharset(encoding) {
	return TI_CODEC_MAP.get(encoding);
}

function bufferToUTF16String(tiBuffer, start, length) {
	let out = '';
	let i = start;
	while (i < length) {
		// utf-16/ucs-2 is 2-bytes per character
		const byte1 = tiBuffer[i++];
		const byte2 = tiBuffer[i++];
		const code_unit = (byte2 << 8) + byte1; // we mash together the two bytes
		out += String.fromCodePoint(code_unit);
	}

	return out;
}

/**
 * loop over input, every 2 characters, parse as an int
 * basically each two characters are a "byte" or an 8-bit uint
 * we append them all together to form a single buffer holding all the values
 * @param {string} value string we're encoding in hex
 * @returns {integer[]} array of encoded bytes
 */
function stringToHexBytes(value) {
	const length = value.length / 2;
	const byteArray = [];
	for (let i = 0; i < length; i++) {
		const numericValue = parseInt(value.substr(i * 2, 2), 16);
		if (!Number.isNaN(numericValue)) { // drop bad hex characters
			byteArray.push(numericValue);
		}
	}
	return byteArray;
}

// Use a Proxy to hack array style index accessors
const arrayIndexHandler = {
	get(target, propKey, receiver) {
		if (typeof propKey === 'string') {
			const num = Number(propKey);
			if (Number.isSafeInteger(num)) {
				return getAdjustedIndex(target, num);
			}
		} else if (propKey === isBuffer) {
			return true;
		}
		return Reflect.get(target, propKey, receiver);
	},

	set(target, propKey, value, receiver) {
		if (typeof propKey === 'string') {
			const num = Number(propKey);
			if (Number.isSafeInteger(num)) {
				setAdjustedIndex(target, num, value);
				return true;
			}
		}
		return Reflect.set(target, propKey, value, receiver);
	},

	has(target, key) {
		if (typeof key === 'string') {
			const num = Number(key);
			if (Number.isSafeInteger(num)) {
				// ensure it's a positive "safe" integer within the range of the buffer
				return num >= 0 && num < target._tiBuffer.length;
			}
		}
		return key in target;
	}
};

function getAdjustedIndex(buf, index) {
	if (index < 0 || index >= buf._tiBuffer.length) {
		return undefined;
	}
	return buf._tiBuffer[index + buf.byteOffset];
}

function setAdjustedIndex(buf, index, value) {
	if (index >= 0 || index < buf._tiBuffer.length) {
		buf._tiBuffer[index + buf.byteOffset] = value;
	}
}

/**
 * Wraps creation of a Buffer instance inside a Proxy so we can handle array index access
 * @param  {...any} args argunents ot Buffer constructor
 * @returns {Buffer} wrapped inside a Proxy
 */
function newBuffer(...args) {
	return new Proxy(new Buffer(...args), arrayIndexHandler); // eslint-disable-line security/detect-new-buffer
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
