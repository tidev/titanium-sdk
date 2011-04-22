describe("Ti.Stream tests", {
	before_all: function() {
		// createBuffer should be tested by Ti.Buffer
		this.sourceBuffer = Ti.createBuffer({
				data:"All work and no play makes Jack a dull boy all work and no play makes Jack a dull boy all work and no play makes Jack a dull boy ALL WORK AND NO PLAY MAKES JACK A DULL BOY"
		});
		this.sourceBlob = Titanium.Filesystem.getFile('spring.txt').read();
		this.sourceBlobStr = this.sourceBlob.toString();
		this.streamFuncs = ['read', 'write', 'isReadable', 'isWritable'];
	},

	basicBufferStream: function() {
		var stream = null;
		var sourceBuffer = this.sourceBuffer;
		valueOf(function() {
			stream = Ti.Stream.createStream(sourceBuffer);
		}).shouldNotThrowException();
		valueOf(stream).shouldNotBeNull();
		
		for (var i=0; i < this.streamFuncs.length; i++) {
			var func = stream[this.streamFuncs[i]];
			valueOf(func).shouldBeFunction();
		}
		
		valueOf(stream.isReadable()).shouldBeTrue();
		valueOf(stream.isWritable()).shouldBeTrue();
		
		var destBuffer = Ti.createBuffer({length:30});
		var readBytes = stream.read(destBuffer, 0, 20);
		valueOf(readBytes).shouldBeExactly(20);
		for (var i=0; i < 20; i++) {
			valueOf(sourceBuffer[i]).shouldBeExactly(destBuffer[i]);
		}
		
		var writeBytes = stream.write(destBuffer, 0, destBuffer.length);
		valueOf(writeBytes).shouldBeExactly(destBuffer.length);
		for (var i=0; i < 20; i++) {
			valueOf(sourceBuffer[20+i]).shouldBeExactly(destBuffer[i]);
		}
	},
	
	basicBlobStream: function() {
		var stream = null;
		var sourceBlob = this.sourceBlob;
		valueOf(function() {
			stream = Ti.Stream.createStream(sourceBlob);
		}).shouldNotThrowException();
		valueOf(stream).shouldNotBeNull();
		
		for (var i=0; i < this.streamFuncs.length; i++) {
			var func = stream[this.streamFuncs[i]];
			valueOf(func).shouldBeFunction();
		}
		
		valueOf(stream.isReadable()).shouldBeTrue();
		valueOf(stream.isWritable()).shouldBeFalse();
		
		var destBuffer = Ti.createBuffer({length:30});
		var readBytes = stream.read(destBuffer, 0, 20);
		valueOf(readBytes).shouldBeExactly(20);
		var str = sourceBlob.toString();
		for (var i=0; i < 20; i++) {
			valueOf(str.charCodeAt(i)).shouldBeExactly(destBuffer[i]);
		}
	},
	
	asyncRead: asyncTest({
		start: function() {
			// This stuff has to be copied into each asynch test because it lives
			// in a different 'this' context
			var sourceBuffer = Ti.createBuffer({
				data:"All work and no play makes Jack a dull boy all work and no play makes Jack a dull boy all work and no play makes Jack a dull boy ALL WORK AND NO PLAY MAKES JACK A DULL BOY"
			});
			var sourceBlob = Titanium.Filesystem.getFile('spring.txt').read();
			var sourceBlobStr = sourceBlob.toString();
			var finished = false;
		
			// read(source,dest,callback) on BufferStream
			var bufferStream = Ti.Stream.createStream(sourceBuffer);
			valueOf(bufferStream).shouldNotBeNull();
			var dest = Ti.createBuffer({length:50});
			valueOf(dest).shouldNotBeNull();
			
			// Perform read(source,dest,callback)
			Ti.Stream.read(bufferStream, dest, this.async(function(e) {
				valueOf(e.errorState).shouldBeUndefined();
				valueOf(e.errorDescription).shouldBeUndefined();
				valueOf(e.bytesProcessed).shouldBeExactly(dest.length);				
				
				for (var i=0; i < dest.length; i++) {
					valueOf(dest[i]).shouldBeExactly(sourceBuffer[i]);
				}
				finished = true;
			}));
			
			
			// Performing the second read while the first read is happening
			// mungs data that gets checked in the callback...
			// have to busywait until the FIRST async call is done.
			var timer = null;
			var callback = this.async(function(e) {
				valueOf(e.errorState).shouldBeUndefined();
				valueOf(e.errorDescription).shouldBeUndefined();
				valueOf(e.bytesProcessed).shouldBeExactly(length);				
				
				for (var i=o; i < length; i++) {
					valueOf(dest[i+offset]).shouldBeExactly(blobStr.charCodeAt(i));
				}				
			});
			
			function spinWait() {
				if (!finished) {
					timer = setTimeout(spinWait, 200);
				}
				else {
					var blobStream = Ti.Stream.createStream(sourceBlob);
					valueOf(blobStream).shouldNotBeNull();
					var blobStr = sourceBlob.toString();
					
					// Perform read(source,dest,offset,length,callback)
					var offset = 10;
					var length = 20;
					Ti.Stream.read(blobStream, dest, offset, length, callback);
				}
			}
			timer = setTimeout(spinWait, 200);
		},
		timeout: 10000,
		timeoutError: "Timed out waiting for async read"
	}),

	asyncWrite: asyncTest({
		start: function() {
			// This stuff has to be copied into each asynch test because it lives
			// in a different 'this' context
			var sourceBuffer = Ti.createBuffer({
				data:"All work and no play makes Jack a dull boy all work and no play makes Jack a dull boy all work and no play makes Jack a dull boy ALL WORK AND NO PLAY MAKES JACK A DULL BOY"
			});
		
			var dest = Ti.createBuffer({length:sourceBuffer.length});
			valueOf(dest).shouldNotBeNull();
			var bufferStream = Ti.Stream.createStream(dest);
			valueOf(bufferStream).shouldNotBeNull();
			
			var offset = 10;
			var length = 20;
			var finished = false;
			
			// Need to perform offset/length write first so that the destination buffer doesn't fill
			Ti.Stream.write(bufferStream, sourceBuffer, offset, length, this.async(function(e) {
				valueOf(e.errorState).shouldBeUndefined();
				valueOf(e.errorDescription).shouldBeUndefined();
				valueOf(e.bytesProcessed).shouldBeExactly(length);
				
				for (var i=0; i < length; i++) {
					valueOf(dest[i]).shouldBeExactly(sourceBuffer[i+offset]);
				}
				
				finished = true;
			}));
			
			// We can't have a 'this.async' inside of another callback, so we
			// have to busywait until the FIRST async call is done.
			var timer = null;
			var callback = this.async(function(e) {
				valueOf(e.errorState).shouldBeUndefined();
				valueOf(e.errorDescription).shouldBeUndefined();
				valueOf(e.bytesProcessed).shouldBeExactly(sourceBuffer.length - length);
				
				for (var i=0; i < dest.length - length; i++) {
					valueOf(dest[i+length]).shouldBeExactly(sourceBuffer[i]);
				}
			});
			
			function spinWait() {
				if (!finished) {
					timer = setTimeout(spinWait, 200);
				}
				else {
					Ti.Stream.write(bufferStream, sourceBuffer, callback);
				}
			}
			timer = setTimeout(spinWait, 200);
		},
		timeout: 10000,
		timeoutError: "Timed out waiting for async write"
	}),

	readAll: asyncTest({
		start: function() {
			// This stuff has to be copied into each asynch test because it lives
			// in a different 'this' context
			var sourceBuffer = Ti.createBuffer({
				data:"All work and no play makes Jack a dull boy all work and no play makes Jack a dull boy all work and no play makes Jack a dull boy ALL WORK AND NO PLAY MAKES JACK A DULL BOY"
			});
			var sourceBlob = Titanium.Filesystem.getFile('spring.txt').read();
			var sourceBlobStr = sourceBlob.toString();
			
			var bufferStream = Ti.Stream.createStream(sourceBuffer);
			valueOf(bufferStream).shouldNotBeNull();
			
			var buffer;
			function assignBuffer() {
				buffer = Ti.Stream.readAll(bufferStream);
			}
			valueOf(assignBuffer).shouldNotThrowException();
			valueOf(buffer).shouldNotBeNull();
			valueOf(buffer.length).shouldBeExactly(sourceBuffer.length);
			
			for (var i=0; i < buffer.length; i++) {
				valueOf(buffer[i]).shouldBeExactly(sourceBuffer[i]);
			}
			
			var blobStream = Ti.Stream.createStream(sourceBlob);
			valueOf(blobStream).shouldNotBeNull();
			
			// TODO: Should we be required to create this buffer, or should it be autocreated?
			var dest = Ti.createBuffer({length:sourceBlobStr.length});
			valueOf(dest).shouldNotBeNull();
			
			Ti.Stream.readAll(blobStream, dest, this.async(function(e) {
				valueOf(e.errorState).shouldBeUndefined();
				valueOf(e.errorDescription).shouldBeUndefined();
				valueOf(e.bytesProcessed).shouldBeExactly(sourceBlobStr.length);
				
				for (var i=0; i < dest.length; i++) {
					valueOf(dest[i]).shouldBeExactly(sourceBlobStr.charCodeAt(i));
				}
			}));
		},
		timeout: 10000,
		timeoutError: "Timed out waiting for readAll"
	}),

	writeStream: asyncTest({
		start: function() {
			// This stuff has to be copied into each asynch test because it lives
			// in a different 'this' context
			var sourceBuffer = Ti.createBuffer({
				data:"All work and no play makes Jack a dull boy all work and no play makes Jack a dull boy all work and no play makes Jack a dull boy ALL WORK AND NO PLAY MAKES JACK A DULL BOY"
			});
			var sourceBlob = Titanium.Filesystem.getFile('spring.txt').read();
			var sourceBlobStr = sourceBlob.toString();
			
			var dest = Ti.createBuffer({length:100});
			var destStream = Ti.Stream.createStream(dest);
			valueOf(destStream).shouldNotBeNull();
			
			var blobStream = Ti.Stream.createStream(sourceBlob);
			valueOf(blobStream).shouldNotBeNull();
			
			Ti.Stream.writeStream(blobStream, destStream, 10);
			
			for (var i=0; i < dest.length; i++) {
				valueOf(dest[i]).shouldBeExactly(sourceBlobStr.charCodeAt(i));
			}
			
			var destStream2 = Ti.Stream.createStream(dest);
			valueOf(destStream2).shouldNotBeNull();
			
			var bufferStream = Ti.Stream.createStream(sourceBuffer);
			valueOf(bufferStream).shouldNotBeNull();
			
			Ti.Stream.writeStream(bufferStream, destStream2, 20, this.async(function(e) {
				valueOf(e.errorState).shouldBeUndefined();
				valueOf(e.errorDescription).shouldBeUndefined();
				valueOf(e.bytesProcessed).shouldBeExactly(dest.length);				
				
				for (var i=0; i < dest.length; i++) {
					valueOf(sourceBuffer[i]).shouldBeExactly(dest[i]);
				}
			}));
		},
		timeout: 10000,
		timeoutError: "Timed out waiting for writeStream"
	}),

	pump: asyncTest({
		start: function() {
			// This stuff has to be copied into each asynch test because it lives
			// in a different 'this' context
			var sourceBuffer = Ti.createBuffer({
				data:"All work and no play makes Jack a dull boy all work and no play makes Jack a dull boy all work and no play makes Jack a dull boy ALL WORK AND NO PLAY MAKES JACK A DULL BOY"
			});
			var sourceBlob = Titanium.Filesystem.getFile('spring.txt').read();
			var sourceBlobStr = sourceBlob.toString();
		
			var chunksize = 20;
			var totalsize = 0;
			var sourceValue = null; // Used as a function for handling comparison
			
			function handler(e) {
				valueOf(e.errorState).shouldBeUndefined();
				valueOf(e.errorDescription).shouldBeUndefined();
				valueOf(e.bytesProcessed).shouldBeLessThanEqual(chunksize);
				valueOf(e.buffer).shouldNotBeNull();
				
				for (var i=0; i < e.buffer.length; i++) {
					valueOf(e.buffer[i]).shouldBeExactly(sourceValue(i,totalsize));
				}
				totalsize += e.bytesProcessed;
				valueOf(totalsize).shouldBeExactly(e.totalBytesProcessed);
			}
			
			var bufferStream = Ti.Stream.createStream(sourceBuffer);
			valueOf(bufferStream).shouldNotBeNull();
			sourceValue = function(pos, totalsize) {
				return sourceBuffer[totalsize+pos];
			};
			// Synch pump
			Ti.Stream.pump(bufferStream, handler, chunksize, false);
			
			var blobStream = Ti.Stream.createStream(sourceBlob);
			valueOf(blobStream).shouldNotBeNull();
			sourceValue = function(pos, totalsize) {
				return sourceBlobStr.charCodeAt(pos+totalsize);
			};
			// Asynch pump
			Ti.Stream.pump(blobStream, this.async(handler), chunksize);
		},
		timeout: 10000,
		timeoutError: "Timed out waiting for pump"
	}),
});