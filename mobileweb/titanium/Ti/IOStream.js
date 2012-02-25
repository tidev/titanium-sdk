define(["Ti/_/declare", "Ti/_/Evented", "Ti/Buffer"], function(declare, Evented, Buffer) {

	return declare("Ti.IOStream", Evented, {

		constructor: function() {
			this._data = "";
		},

		close: function() {
			this._closed = true;
		},

		isReadable: function() {
			return !this._closed;
		},

		isWriteable: function() {
			return !this._closed;
		},

		read: function(buffer, offset, length) {
			if (!this._closed) {
				var d = this._data,
					len = length || d.length,
					bytesRead = buffer.append(d.substring(offset || 0, len));
				this._data = d.substring(len);
				return bytesRead;
			}
			return 0;
		},

		write: function(buffer, offset, length) {
			if (!this._closed) {
				var b = buffer.buffer;
				offset = offset | 0;
				length = length || b.length;
				this._data += b.substring(offset, length);
				return length - offset;
			}
			return 0;
		}

	});

});