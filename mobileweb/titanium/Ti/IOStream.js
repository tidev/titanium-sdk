define(["Ti/_/declare", "Ti/_/Evented", "Ti/Buffer", "Ti/Filesystem"], function(declare, Evented, Buffer, Filesystem) {

	return declare("Ti.IOStream", Evented, {

		constructor: function(args) {
			args = args || {};
			this._data = args.data || "";
			this._mode = args.mode || Filesystem.MODE_APPEND;
		},

		close: function() {
			this._closed = true;
		},

		isReadable: function() {
			return !this._closed;
		},

		isWriteable: function() {
			return !this._closed && (this._mode === Filesystem.MODE_WRITE || this._mode === Filesystem.MODE_APPEND);
		},

		read: function(buffer, offset, length) {
			if (this.isReadable()) {
				var d = this._data,
					len = length || d.length,
					bytesRead = buffer.append(new Buffer({ value: d.substring(offset || 0, len) }));
				this._data = d.substring(len);
				return bytesRead;
			}
			return 0;
		},

		write: function(buffer, offset, length) {
			if (this.isWriteable()) {
				var b = buffer.value;
				offset = offset | 0;
				length = length || b.length;
				this._data += b.substring(offset, length);
				return length - offset;
			}
			return 0;
		}

	});

});