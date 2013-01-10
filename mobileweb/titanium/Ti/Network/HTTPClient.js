define(["Ti/_", "Ti/_/declare", "Ti/_/has", "Ti/_/lang", "Ti/_/Evented", "Ti/Filesystem", "Ti/Network", "Ti/Blob", "Ti/_/event"],
	function(_, declare, has, lang, Evented, Filesystem, Network, Blob, event) {

	var is = require.is,
		on = require.on;

	return declare("Ti.Network.HTTPClient", Evented, {
		//This variable shows that responseType of XMLHttpRequest is 'arraybuffer'
		//This type is valid only for async mode
		_isArrayBuffer: void 0,
		
		constructor: function() {
			var xhr = this._xhr = new XMLHttpRequest;

			this._handles = [
				on(xhr, "error", this, "_onError"),
				xhr.upload && on(xhr.upload, "error", this, "_onError"),
				on(xhr, "progress", this, function(evt) {
					evt.progress = evt.lengthComputable ? evt.loaded / evt.total : false;
					is(this.ondatastream, "Function") && this.ondatastream.call(this, evt);
				}),
				xhr.upload && on(xhr.upload, "progress", this, function(evt) {
					evt.progress = evt.lengthComputable ? evt.loaded / evt.total : false;
					is(this.onsendstream, "Function") && this.onsendstream.call(this, evt);
				})
			];

			xhr.onreadystatechange = lang.hitch(this, function() {
				var c = this.constants,
					file,
					mimeType,
					blobData = "",
					onload = this.onload;

				switch (xhr.readyState) {
					case 0: c.readyState = this.UNSENT; break;
					case 1: c.readyState = this.OPENED; break;
					case 2: c.readyState = this.LOADING; break;
					case 3: c.readyState = this.HEADERS_RECEIVED; break;
					case 4:
						clearTimeout(this._timeoutTimer);
						this._completed = 1;
						c.readyState = this.DONE;
						
						if (!this._aborted) {
							//create file by name
							this.file && (file = Filesystem.getFile(Filesystem.applicationDataDirectory, this.file));
							
							mimeType =  xhr.getResponseHeader("Content-Type");
							
							if (this._isArrayBuffer) {
								//parse arraybuffer`s response in async mode
								c.responseXML  = c.responseText = "";
								if (xhr.response) {
									//prepare Base64-encoded string required by Blob
									var uInt8Array = new Uint8Array(xhr.response),
										i = uInt8Array.length,
										binaryString = new Array(i);
										
									while (i--)	{
										binaryString[i] = String.fromCharCode(uInt8Array[i]);
									}
									
									c.responseText = c.responseXML = binaryString.join('');
									blobData = _.isBinaryMimeType(mimeType) ? window.btoa(c.responseText) : c.responseText;
								} 
							} else {
								//sync mode
								c.responseXML = xhr.responseXML;
								c.responseText = blobData = xhr.responseText;
								//to do: encode binary data as in async mode!!!
								//because responseType='arraybuffer' is not supported in sync mode (throws exception)
							}
							
							//responseData = Blob
							c.responseData = new Blob({
								data: blobData,
								length: blobData.length,
								mimeType: mimeType || "text/plain",
								file: file || null,
								nativePath: (file && file.nativePath) || null,
							});
								
							//write Blob to file
							file && file.writable && file.write(c.responseData);
														
							has("ti-instrumentation") && (instrumentation.stopTest(this._requestInstrumentationTest, this.location));
							xhr.status >= 400 && (onload = this._onError);
							is(onload, "Function") && onload.call(this);
						}
				}

				this._fireStateChange();
			});
		},

		destroy: function() {
			if (this._xhr) {
				this._xhr.abort();
				this._xhr = null;
			}
			event.off(this._handles);
			Evented.destroy.apply(this, arguments);
		},

		_onError: function(error) {
			this.abort();
			is(error, "Object") || (error = { message: error });
			error.source = this;
			error.type = "error";
			error.error || (error.error = error.message || this._xhr.status);
			parseInt(error.error) || (error.error = "Can't reach host");
			is(this.onerror, "Function") && this.onerror.call(this, error);
		},

		abort: function() {
			clearTimeout(this._timeoutTimer);
			this._aborted = 1;
			this.connected && this._xhr.abort();
			this.constants.readyState = this.UNSENT;
			this._fireStateChange();
		},
		
		_fireStateChange: function() {
			is(this.onreadystatechange, "Function") && this.onreadystatechange.call(this);
		},
		
		getResponseHeader: function(name) {
			return this._xhr.readyState > 1 ? this._xhr.getResponseHeader(name) : null;
		},

		open: function(method, url, async) {
			var httpURLFormatter = Ti.Network.httpURLFormatter,
				c = this.constants,
				wc = this.withCredentials;
			this.abort();
			this._xhr.open(
				c.connectionType = method,
				c.location = _.getAbsolutePath(httpURLFormatter ? httpURLFormatter(url) : url),
				this._isArrayBuffer = wc || async === void 0 ? true : !!async
			);
			
			//in async mode we are using 'responseType=arraybuffer'
			if (this._isArrayBuffer) {
				this._xhr.responseType = 'arraybuffer';
			}
				
			wc && (this._xhr.withCredentials = wc);
		},

		send: function(args){
			try {
				var timeout = this.timeout | 0;
				this._aborted = this._completed = 0;
				has("ti-instrumentation") && (this._requestInstrumentationTest = instrumentation.startTest("HTTP Request")),
				args = is(args, "Object") ? lang.urlEncode(args) : args;
				args && this._xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
				this._xhr.send(args);
				clearTimeout(this._timeoutTimer);
				timeout && (this._timeoutTimer = setTimeout(lang.hitch(this, function() {
					if (this.connected) {
						this.abort();
						!this._completed && this._onError("Request timed out");
					}
				}), timeout));
			} catch (ex) {}
		},

		setRequestHeader: function(name, value) {
			this._xhr.setRequestHeader(name, value);
		},

		properties: {
			ondatastream: void 0,
			onerror: void 0,
			onload: void 0,
			onreadystatechange: void 0,
			onsendstream: void 0,
			timeout: void 0,
			withCredentials: false
		},

		constants: {
			DONE: 4,

			HEADERS_RECEIVED: 2,

			LOADING: 3,

			OPENED: 1,

			UNSENT: 1,
			
			allResponseHeaders: function() {
				return this._xhr.getAllResponseHeaders() || "";
			},

			connected: function() {
				return this.readyState >= this.OPENED;
			},

			connectionType: void 0,

			location: void 0,

			readyState: this.UNSENT,

			responseData: void 0,

			responseText: void 0,

			responseXML: void 0,

			status: function() {
				return this._xhr.status;
			},

			statusText: function() {
				return this._xhr.statusText;
			}
		}

	});

});
