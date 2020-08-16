import { isBuffer } from './internal/util';
import { stringToHexBytes } from './internal/buffer';

// This is a special Buffer that wraps Ti.Buffer
// as a result it is *much* slower to read/write values
// because we need to go across the JS/Native boundary per-byte!
// We also need to use a Proxy to handle intercepting set/get of indices to redirect to the underlying Ti.Buffer
export default class SlowBuffer {
	/**
	 * Constructs a new buffer.
	 *
	 * Primarily used internally in this module together with `newBuffer` to
	 * create a new Buffer instance wrapping a Ti.Buffer.
	 *
	 * Also supports the deprecated Buffer() constructors which are safe
	 * to use outside of this module.
	 *
	 * @param {Ti.Buffer} tiBuffer the underlying data/bytes
	 * @param {integer} [start=0] start offset of array/buffer
	 * @param {integer} [length] length of the underlying array/buffer to wrap
	 */
	constructor(tiBuffer, start = 0, length = tiBuffer.length - start) {
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

	/**
	 * Wraps creation of a Buffer instance inside a Proxy so we can handle array index access
	 * @param {Ti.Buffer} tiBuffer the underlying data/bytes
	 * @param {integer} [start=0] start offset of array/buffer
	 * @param {integer} [length] length of the underlying array/buffer to wrap
	 * @returns {Buffer} wrapped inside a Proxy
	 */
	static fromTiBuffer(tiBuffer, start, length) {
		return new Proxy(new SlowBuffer(tiBuffer, start, length), arrayIndexHandler); // eslint-disable-line security/detect-new-buffer
	}

	static fromString(value, encoding) {
		if (!Buffer.isEncoding(encoding)) {
			throw new TypeError(`Unknown encoding: ${encoding}`);
		}
		encoding = encoding.toLowerCase();
		if (encoding === 'base64') {
			const blob = Ti.Utils.base64decode(value);
			const blobStream = Ti.Stream.createStream({ source: blob, mode: Ti.Stream.MODE_READ });
			const buffer = Ti.Stream.readAll(blobStream);
			blobStream.close();
			return SlowBuffer.fromTiBuffer(buffer);
		}
		if (encoding === 'hex') {
			const bytes = stringToHexBytes(value);
			const length = bytes.length;
			const tiBuffer = Ti.createBuffer({ length });
			for (let i = 0; i < length; i++) {
				tiBuffer[i] = bytes[i] & 0xFF; // mask to one byte
			}

			return SlowBuffer.fromTiBuffer(tiBuffer);
		}
		const tiBuffer = Ti.createBuffer({ value: value, type: getTiCodecCharset(encoding) });
		return SlowBuffer.fromTiBuffer(tiBuffer);
	}

	// This is a method we should get by extending Uint8Array, so really should only be overriden on a "SlowBuffer" that wraps Ti.Buffer
	get buffer() {
		// Get the slice of the array from byteOffset to length
		return Uint8Array.from(this).buffer;
	}

	_slice(offset, length) {
		return SlowBuffer.fromTiBuffer(this._tiBuffer, offset, length);
	}

	_fill(value, offset, end, encoding) {
		const valueType = typeof value;
		if (valueType === 'string') {
			const bufToFillWith = SlowBuffer.fromString(value, encoding);
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
	}

	getAdjustedIndex(index) {
		return getAdjustedIndex(this, index);
	}

	setAdjustedIndex(index, value) {
		return setAdjustedIndex(this, index, value);
	}

	// This is a method we should get by extending Uint8Array, so really should only be overriden on a "SlowBuffer" that wraps Ti.Buffer
	set(src, offset = 0) {
		const numBytes = src.length;
		// check src.length + offset doesn't go beyond our length!
		// FIXME: Re-enable
		// checkOffset(this, offset, numBytes);
		// copy src values into this buffer starting at offset
		for (let i = 0; i < numBytes; i++) {
			setAdjustedIndex(this, i + offset, src[i]);
		}
	}

	/**
	 * Provides a conversion method for interacting with Ti APIs that require a Ti.Buffer
	 * @returns {Ti.Buffer} the underlying Ti.Buffer backing this Buffer instance
	 */
	toTiBuffer() {
		if (this.length === this._tiBuffer.length && this.byteOffset === 0) {
			return this._tiBuffer;
		}
		return this._tiBuffer.clone(this.byteOffset, this.length);
	}
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
	if (index < 0) {
		return undefined;
	}
	// Wrapping Ti.Buffer?
	if (buf._tiBuffer) {
		if (index >= buf._tiBuffer.length) {
			return undefined;
		}
		return buf._tiBuffer[index + buf.byteOffset];
	}
	// Raw TypedArray/ArrayBuffer
	// FIXME: do we need to account for byteOffset here?
	return buf[index];
}

function setAdjustedIndex(buf, index, value) {
	if (index < 0) {
		return;
	}
	// Wrapping Ti.Buffer?
	if (buf._tiBuffer) {
		if (index < buf._tiBuffer.length) {
			buf._tiBuffer[index + buf.byteOffset] = value;
		}
		return;
	}
	// Raw TypedArray/ArrayBuffer
	// FIXME: do we need to account for byteOffset here?
	buf[index] = value;
}

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
/**
 * @param {string} encoding desired encoding name
 * @returns {integer} Ti.Codec constant that maps to the encoding
 */
function getTiCodecCharset(encoding) {
	return TI_CODEC_MAP.get(encoding);
}
