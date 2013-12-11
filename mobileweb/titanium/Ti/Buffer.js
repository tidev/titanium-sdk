define(["Ti/_/declare", "Ti/_/Evented", "Ti/Blob", "Ti/Codec"], function(declare, Evented, Blob, Codec) {

	var Buffer;

	return Buffer = declare("Ti.Buffer", Evented, {

		constructor: function(args) {
			args && args.value && this._set(args.value);
		},

		append: function(buffer, offset, len) {
			var v = buffer.value;
			offset = offset | 0,
			length = length || v.length;
			this._set(this.value + v.substring(offset, offset + length));
			return length - offset;
		},

		clear: function() {
			this._set("");
		},

		clone: function(offset, length) {
			return new Buffer({ value: offset ? this.value.substring(offset, length && offset + length) : this.value });
		},

		copy: function(srcBuffer, offset, srcOffset, srcLength) {
			var v = srcBuffer.value,
				offset = offset | 0,
				srcOffset = srcOffset | 0,
				len = Math.max(this.length, srcLength && srcOffset + srcLength) - offset,
				srcBuffer = v.substring(srcOffset, len);
			this._set(this.value.substring(0, offset) + srcBuffer + this.value.substring(offset, srcBuffer.length - offset));
		},

		fill: function(fillByte, offset, length) {
			if (!fillByte) {
				throw new Error("Missing fillByte argument");
			}
			offset = offset | 0;
			length = this.length - offset - length | 0;
			this._set(this.value.substring(0, offset | 0) + (new Array(length)).join((fillByte + ' ').charAt(0)) + this.value.substring(length));
		},

		insert: function(buffer, offset, srcOffset, srcLength) {
			var b = buffer.value;
			srcOffset = srcOffset | 0;
			offset = offset | 0;
			this._set(this.value.substring(0, offset) + v.substring(srcOffset, srcLength && srcOffset + srcLength) + this.value.substring(offset));
			return srcLength || v.length;
		},

		release: function() {
			this.length = 0;
		},

		toBlob: function() {
			return new Blob({ data: this.value });
		},

		toString: function() {
			return ""+this.value;
		},

		_set: function(value) {
			this.__values__.constants.value = ""+value;
		},

		_resize: function(offset, length) {
			offset = offset | 0;
			this._set(this.value.substring(offset, length && (offset + length | 0)));
		},

		constants: {
			byteOrder: Codec.LITTLE_ENDIAN,
			type: Codec.CHARSET_UTF8,
			value: ""
		},

		properties: {
			length: {
				get: function() {
					return this.value.length;
				},
				set: function(newValue, oldValue) {
					if (newValue < oldValue) {
						this._resize(0, newValue);
					} else {
						this.__values__.constants.value += (new Array(newValue - oldValue)).join(' ');
					}
					return newValue;
				}
			}
		}

	});

});