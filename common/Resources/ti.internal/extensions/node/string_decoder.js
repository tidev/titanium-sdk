/**
 * @param {string} [encoding='utf8'] The character encoding the `StringDecoder` will use.
 */
function StringDecoder(encoding = 'utf8') {
	this.encoding = encoding.toLowerCase();
	switch (this.encoding) {
		case 'utf8':
		case 'utf-8':
			this._impl = new Utf8StringDecoder();
			break;
		case 'ucs2':
		case 'ucs-2':
		case 'utf16-le':
		case 'utf16le':
			this._impl = new Utf16StringDecoder();
			break;
		case 'base64':
			this._impl = new Base64StringDecoder();
			break;
		default:
			this._impl = new StringDecoderImpl(this.encoding);
			break;
	}
}

/**
 * Returns any remaining input stored in the internal buffer as a string.
 * Bytes representing incomplete UTF-8 and UTF-16 characters will be replaced with substitution
 * characters appropriate for the character encoding.
 *
 * If the buffer argument is provided, one final call to stringDecoder.write() is performed before returning the remaining input.
 * @param {Buffer} [buffer] containing the bytes to decode.
 * @returns {string}
 */
StringDecoder.prototype.end = function end(buffer) {
	return this._impl.end(buffer);
};

/**
 * Returns a decoded string, ensuring that any incomplete multibyte characters at the end of the Buffer, or
 * TypedArray, or DataView are omitted from the returned string and stored in an internal buffer for the
 * next call to stringDecoder.write() or stringDecoder.end().
 * @param {Buffer|TypedArray|DataView} buffer containing the bytes to decode.
 * @returns {string}
 */
StringDecoder.prototype.write = function write(buffer) {
	if (typeof buffer === 'string') {
		return buffer;
	}
	// empty string for empty buffer
	if (buffer.length === 0) {
		return '';
	}
	return this._impl.write(buffer);
};

/**
 * This is the base class. We override parts of it for certain encodings. For ascii/hex/binary/latin1 the impl is super-easy
 */
class StringDecoderImpl {
	constructor(encoding = 'utf8') {
		this.encoding = encoding;
		this.byteCount = 0;
		this.charLength = 1;
	}

	// the actual underlying implementation!
	end(buffer) {
		if (buffer && buffer.length !== 0) {
			return this.write(buffer);
		}
		return '';
	}

	write(buffer) {
		if (buffer && buffer.length !== 0) {
			return buffer.toString(this.encoding); // single byte character encodings are a cinch
		}
		return ''; // no buffer, or empty
	}
}

// For multi-byte encodings, let's implement some base logic...
class MultiByteStringDecoderImpl extends StringDecoderImpl {
	constructor(encoding, bytesPerChar) {
		super(encoding);
		this.incomplete = Buffer.allocUnsafe(bytesPerChar); // temporary incomplete character buffer
	}

	/**
	 * @typedef {Object} IncompleteCharObject
	 * @property {integer} bytesNeeded bytes missing to complete the character
	 * @property {integer} charLength bytes expected to complete the character
	 * @property {integer} index location in the buffer where the character starts
	 */

	/**
	 * Given a Buffer, sees if we have an incomplete "character" at the end of it.
	 * Returns info on that:
	 * - bytesNeeded: 0-3, number of bytes still remaining
	 * - charLength: expected number of bytes for the incomplete character
	 * - index: index in the buffer where the incomplete character begins
	 * @param {Buffer} _buffer Buffer we are checking to see if it has an incompelte "character" at the end
	 * @returns {IncompleteCharObject}
	 */
	_checkIncompleteBytes(_buffer) {
		throw new Error('subclasses must override!');
	}

	_incompleteEnd() {
		throw new Error('subclasses must override!');
	}

	_incompleteBufferEmptied() {
		// typically we reset byte count back to 0 and character length to 1
		this.byteCount = 0;
		this.charLength = 1;
	}

	end(buffer) {
		let result = super.end(buffer);
		if (this.byteCount !== 0) {
			// we have incomplete characters!
			result += this._incompleteEnd();
		}
		this._incompleteBufferEmptied(); // reset our internals to "wipe" the incomplete buffer
		return result;
	}

	write(buffer) {
		// first let's see if we had some multi-byte character we didn't finish...
		let char = '';
		if (this.byteCount !== 0) {
			// we still needed some bytes to finish the character
			// How many bytes do we still need? charLength - bytes we received
			const left = this.charLength - this.byteCount; // need 4, have 1? then we have 3 "left"

			const bytesCopied = Math.min(left, buffer.length); // copy up to that many bytes
			// copy bytes from `buffer` to our incomplete buffer
			buffer.copy(this.incomplete, this.byteCount, 0, bytesCopied);
			this.byteCount += bytesCopied; // record how many more bytes we copied...

			if (bytesCopied < left) { // still need more bytes to complete!
				return '';
			}

			// we were able to complete, yay!
			// grab the character we completed
			char = this.incomplete.slice(0, this.charLength).toString(this.encoding);
			// reset our counters
			this._incompleteBufferEmptied();
			// do we have any bytes left in this buffer?
			if (bytesCopied === buffer.length) {
				return char; // if not, return the character we finished!
			}
			// we still have more bytes, so slice the buffer up
			buffer = buffer.slice(bytesCopied, buffer.length);
		}

		// check this buffer to see if it indicates we need more bytes?
		const incompleteCharData = this._checkIncompleteBytes(buffer);
		if (incompleteCharData.bytesNeeded === 0) {
			return char + buffer.toString(this.encoding); // no incomplete bytes, return any character we completed plus the buffer
		}

		// ok so the buffer holds an incomplete character at it's end
		this.charLength = incompleteCharData.charLength; // record how many bytes we need for the 'character'
		const incompleteCharIndex = incompleteCharData.index; // this is the index of the multibyte character that is incomplete

		// copy from index of incomplete character to end of buffer
		const bytesToCopy = buffer.length - incompleteCharIndex;
		buffer.copy(this.incomplete, 0, incompleteCharIndex, buffer.length);
		this.byteCount = bytesToCopy; // record how many bytes we actually copied

		if (bytesToCopy < buffer.length) { // buffer had bytes before the incomplete character
			// so smush any character we may have completed with any complete characters in the buffer
			return char + buffer.toString(this.encoding, 0, incompleteCharIndex);
		}
		return char; // any now-completed character that was previously incomplete, possibly empty
	}
}

class Utf8StringDecoder extends MultiByteStringDecoderImpl {
	constructor() {
		super('utf8', 4);
	}

	_checkIncompleteBytes(buffer) {
		const length = buffer.length;
		// FIXME: In Node, they check the last character first!
		// And they rely on Buffer#toString() to handle injecting the '\ufffd' character for busted multi-byte sequences!
		// iOS apparently just returns undefined in that special case and
		// Android differs here because we don't work backwards from the last char
		// Can we cheat here and...
		// see https://github.com/nodejs/string_decoder/blob/master/lib/string_decoder.js#L173-L198
		// - if we see a multi-byte character start, validate the next characters are continuation chars
		// - if they're not replace the sequence with '\ufffd', treat like that multi-byte character was "completed"

		// Note that even if we do hack this, if there's some invalid multi-byte UTF-8 in the buffer that isn't at the last 3 bytes
		// then we're at the mercy of the JS engine/platform code for handling that
		// Here's someone's hack there: https://gist.github.com/oleganza/997155

		// if buffer.length >= 3, check 3rd to last byte
		if (length >= 3) {
			let charLength = checkCharLengthForUTF8(buffer[length - 3]);
			if (charLength === 4) {
				return {
					bytesNeeded: 1, // we have 3 last bytes, need 4th
					index: length - 3,
					charLength: 4
				};
			}
		}
		// if buffer.length >= 2, check 2nd to last byte
		if (length >= 2) {
			let charLength = checkCharLengthForUTF8(buffer[length - 2]);
			if (charLength >= 3) {
				return {
					bytesNeeded: charLength - 2, // we have 2 bytes of whatever we need
					index: length - 2,
					charLength
				};
			}
		}
		// if buffer.length >= 1, check last byte
		if (length >= 1) {
			let charLength = checkCharLengthForUTF8(buffer[length - 1]);
			if (charLength >= 2) {
				return {
					bytesNeeded: charLength - 1, // we have 1 byte of whatever we need
					index: length - 1,
					charLength
				};
			}
		}
		// base case, no bytes needed - ends on complete character
		return {
			bytesNeeded: 0,
			index: length - 1,
			charLength: 1
		};
	}

	_incompleteEnd() {
		return '\ufffd'; // we replace the missing character with a special utf8 char
	}
}

class Utf16StringDecoder extends MultiByteStringDecoderImpl {
	constructor() {
		super('utf16le', 4);
	}

	_checkIncompleteBytes(buffer) {
		const length = buffer.length;
		const modulo = length % 2;
		// ok, we have a multiple of 2 bytes
		if (modulo === 0) {
			// is the last byte a leading/high surrogate?
			const byte = buffer[buffer.length - 1];
			if (byte >= 0xD8 && byte <= 0xDB) {
				return {
					bytesNeeded: 2,
					charLength: 4,
					index: length - 2
				};
			}

			// we're good, not a surrogate, so we have our needed 2 bytes
			return {
				bytesNeeded: 0,
				charLength: 2
			};
		}

		// ok we have 1 byte left over, assume we need 2 to form the character
		return {
			bytesNeeded: 1,
			index: length - 1,
			charLength: 2
		};
	}

	_incompleteEnd() {
		// Just write out the last N bytes, hopefully the engine can handle it for us?
		return this.incomplete.toString('utf16le', 0, this.byteCount);
	}
}

class Base64StringDecoder extends MultiByteStringDecoderImpl {
	constructor() {
		super('base64', 3);
		this.charLength = 3; // always 3!
	}

	_checkIncompleteBytes(buffer) {
		const length = buffer.length;
		const modulo = length % 3;
		// base64 needs 3 bytes always, so if we have that many (or a multiple), we have a complete buffer
		if (modulo === 0) {
			return {
				bytesNeeded: 0,
				charLength: 3
			};
		}

		// ok we have 1 or 2 bytes left over
		return {
			bytesNeeded: 3 - modulo, // always need 3, so if we have 1 left over -> need 2
			index: length - modulo,
			charLength: 3 // always need 3
		};
	}

	_incompleteBufferEmptied() {
		this.byteCount = 0;
		this.charLength = 3; // always 3!
	}

	_incompleteEnd() {
		// Just write out the last N bytes, it should insert the '=' placeholders
		// it's not really 'missing'/'incomplete', just needs placeholder insertion
		return this.incomplete.toString('base64', 0, this.byteCount);
	}
}

function checkCharLengthForUTF8(byte) {
	// 11110XXX => 1110 => 0x1E
	if (byte >> 3 === 0x1E) {
		return 4;
	}

	// 1110XXXX => 1110 => 0x1E
	if (byte >> 4 === 0x0E) {
		return 3;
	}

	// 110XXXXX => 110 => 0x06
	if (byte >> 5 === 0x06) {
		return 2;
	}
	return 1;
}

export default { StringDecoder };
