describe("Ti.Stream tests", {
	before_all: function() {
		// createBuffer should be tested by Ti.Buffer
		this.sourceBuffer = Ti.createBuffer({
				value:"All work and no play makes Jack a dull boy all work and no play makes Jack a dull boy all work and no play makes Jack a dull boy ALL WORK AND NO PLAY MAKES JACK A DULL BOY"
		});

		// create file to work with
		var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'streamfile.txt');
		if (file.exists()) {
			file.deleteFile();
		}
		file.write("This is my text1 This is my text2 This is my text3 This is my text4 This is my text5 This is my text6 This is my text7");
		file = null;

		this.sourceBlob = Titanium.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'streamfile.txt').read();
		this.sourceBlobStr = this.sourceBlob.toString();
		this.streamFuncs = ['read', 'write', 'isReadable', 'isWritable'];
	},

	basicBufferStream: function() {
		var rstream = null;
		var wstream = null;
		var astream = null;
		var sourceBuffer = this.sourceBuffer;

		// create read stream
		valueOf(function() {
			rstream = Ti.Stream.createStream({source: sourceBuffer, mode: Ti.Stream.MODE_READ});
		}).shouldNotThrowException();
		valueOf(rstream).shouldNotBeNull();
		
		for (var i=0; i < this.streamFuncs.length; i++) {
			var func = rstream[this.streamFuncs[i]];
			valueOf(func).shouldBeFunction();
		}
		
		valueOf(rstream.isReadable()).shouldBeTrue();
		valueOf(rstream.isWritable()).shouldBeFalse();

		// create write stream
		valueOf(function() {
			wstream = Ti.Stream.createStream({source: sourceBuffer, mode: Ti.Stream.MODE_WRITE});
		}).shouldNotThrowException();
		valueOf(wstream).shouldNotBeNull();
		
		for (var i=0; i < this.streamFuncs.length; i++) {
			var func = wstream[this.streamFuncs[i]];
			valueOf(func).shouldBeFunction();
		}
		
		valueOf(wstream.isReadable()).shouldBeFalse();
		valueOf(wstream.isWritable()).shouldBeTrue();

		// create append stream
		valueOf(function() {
			astream = Ti.Stream.createStream({source: sourceBuffer, mode: Ti.Stream.MODE_APPEND});
		}).shouldNotThrowException();
		valueOf(astream).shouldNotBeNull();
		
		for (var i=0; i < this.streamFuncs.length; i++) {
			var func = astream[this.streamFuncs[i]];
			valueOf(func).shouldBeFunction();
		}
		
		valueOf(astream.isReadable()).shouldBeFalse();
		valueOf(astream.isWritable()).shouldBeTrue();


		var destBuffer = Ti.createBuffer({length:30});
		var readBytes = rstream.read(destBuffer, 0, 20);
		valueOf(readBytes).shouldBeExactly(20);
		for (var i=0; i < readBytes; i++) {
			valueOf(sourceBuffer[i]).shouldBeExactly(destBuffer[i]);
		}

		var writeBytes = wstream.write(destBuffer, 0, destBuffer.length);
		valueOf(writeBytes).shouldBeExactly(destBuffer.length);
		for (var i=0; i < writeBytes; i++) {
			valueOf(sourceBuffer[i]).shouldBeExactly(destBuffer[i]);
		}

		var appendBuffer = Ti.createBuffer({value:"appendme"});
		var appendBytes = astream.write(appendBuffer, 0, appendBuffer.length);
		valueOf(appendBytes).shouldBeExactly(appendBuffer.length);
		for (var i=0; i < appendBytes; i++) {
			valueOf(sourceBuffer[(sourceBuffer.length - appendBuffer.length)+i]).shouldBeExactly(appendBuffer[i]);
		}

		valueOf(function() {astream.close()}).shouldNotThrowException();
	},
	
	basicBlobStream: function() {
		var stream = null;
		var sourceBlob = this.sourceBlob;

		valueOf(function() {
			stream = Ti.Stream.createStream({source: sourceBlob, mode: Ti.Stream.MODE_READ});
		}).shouldNotThrowException();
		valueOf(stream).shouldNotBeNull();
		
		for (var i=0; i < this.streamFuncs.length; i++) {
			var func = stream[this.streamFuncs[i]];
			valueOf(func).shouldBeFunction();
		}
		
		valueOf(stream.isReadable()).shouldBeTrue();
		valueOf(stream.isWritable()).shouldBeFalse();
		
		var destBuffer = Ti.createBuffer({length:50});
		var readBytes = stream.read(destBuffer, 0, 20);
		valueOf(readBytes).shouldBeExactly(20);
		var str = sourceBlob.toString();
		for (var i=0; i < 20; i++) {
			valueOf(str.charCodeAt(i)).shouldBeExactly(destBuffer[i]);
		}

		// read again to ensure position on blob is maintained
		readBytes = stream.read(destBuffer, 20, 20);
		valueOf(readBytes).shouldBeExactly(20);
		for (var i=0; i < 20; i++) {
			valueOf(str.charCodeAt(20 + i)).shouldBeExactly(destBuffer[ 20 + i]);
		}

		valueOf(function() {stream.close()}).shouldNotThrowException();
	},
	
	asyncRead: asyncTest({
		start: function() {
			// This stuff has to be copied into each asynch test because it lives
			// in a different 'this' context
			var sourceBuffer = Ti.createBuffer({
				value:"All work and no play makes Jack a dull boy all work and no play makes Jack a dull boy all work and no play makes Jack a dull boy ALL WORK AND NO PLAY MAKES JACK A DULL BOY"
			});
			var sourceBlob = Titanium.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'streamfile.txt').read();
			var sourceBlobStr = sourceBlob.toString();
			var finished = false;
		
			// read(source,dest,callback) on BufferStream
			var bufferStream = Ti.Stream.createStream({source: sourceBuffer, mode: Ti.Stream.MODE_READ});
			valueOf(bufferStream).shouldNotBeNull();
			var dest = Ti.createBuffer({length:50});
			valueOf(dest).shouldNotBeNull();
			
			// Perform read(source,dest,callback)
			Ti.Stream.read(bufferStream, dest, function(e) {
				valueOf(e.errorState).shouldBeNumber();
				valueOf(e.errorDescription).shouldBeString();
				valueOf(e.bytesProcessed).shouldBeExactly(dest.length);				
				
				for (var i=0; i < dest.length; i++) {
					valueOf(dest[i]).shouldBeExactly(sourceBuffer[i]);
				}
				finished = true;
			});
			

			var offset = 10;
			var length = 20;
			var blobStream = Ti.Stream.createStream({source: sourceBlob, mode: Ti.Stream.MODE_READ});
			valueOf(blobStream).shouldNotBeNull();
			var blobStr = sourceBlob.toString();

			// Performing the second read while the first read is happening
			// mungs data that gets checked in the callback...
			// have to busywait until the FIRST async call is done.
			var timer = null;
			var callback = this.async(function(e) {
				valueOf(e.errorState).shouldBeNumber();
				valueOf(e.errorDescription).shouldBeString();
				valueOf(e.bytesProcessed).shouldBeExactly(length);				
				
				for (var i=0; i < length; i++) {
					valueOf(dest[i+offset]).shouldBeExactly(blobStr.charCodeAt(i));
				}				
			});
			
			function spinWait() {
				if (!finished) {
					timer = setTimeout(spinWait, 200);
				}
				else {
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
				value:"All work and no play makes Jack a dull boy all work and no play makes Jack a dull boy all work and no play makes Jack a dull boy ALL WORK AND NO PLAY MAKES JACK A DULL BOY"
			});
		
			var dest = Ti.createBuffer({length:sourceBuffer.length});
			valueOf(dest).shouldNotBeNull();
			var bufferStream = Ti.Stream.createStream({source:dest, mode: Ti.Stream.MODE_WRITE});
			valueOf(bufferStream).shouldNotBeNull();
			
			var offset = 10;
			var length = 20;
			var finished = false;
			
			// Need to perform offset/length write first so that the destination buffer doesn't fill
			Ti.Stream.write(bufferStream, sourceBuffer, offset, length, function(e) {
				valueOf(e.errorState).shouldBeNumber();
				valueOf(e.errorDescription).shouldBeString();
				valueOf(e.bytesProcessed).shouldBeExactly(length);
				
				for (var i=0; i < length; i++) {
					valueOf(dest[i]).shouldBeExactly(sourceBuffer[i+offset]);
				}
				
				finished = true;
			});
			
			// We can't have a 'this.async' inside of another callback, so we
			// have to busywait until the FIRST async call is done.
			var timer = null;
			var callback = this.async(function(e) {
				valueOf(e.errorState).shouldBeNumber();
				valueOf(e.errorDescription).shouldBeString();
				valueOf(e.bytesProcessed).shouldBeExactly(sourceBuffer.length);
				
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
				value:"All work and no play makes Jack a dull boy all work and no play makes Jack a dull boy all work and no play makes Jack a dull boy ALL WORK AND NO PLAY MAKES JACK A DULL BOY"
			});
			var sourceBlob = Titanium.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'streamfile.txt').read();
			var sourceBlobStr = sourceBlob.toString();
			
			var bufferStream = Ti.Stream.createStream({source:sourceBuffer, mode:Ti.Stream.MODE_READ});
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

			var blobStream = Ti.Stream.createStream({source:sourceBlob, mode:Ti.Stream.MODE_READ});
			valueOf(blobStream).shouldNotBeNull();

			// TODO: Should we be required to create this buffer, or should it be autocreated?
			var dest = Ti.createBuffer({length:sourceBlobStr.length});
			valueOf(dest).shouldNotBeNull();

			Ti.Stream.readAll(blobStream, dest, this.async(function(e) {
				valueOf(e.errorState).shouldBeNumber();
				valueOf(e.errorDescription).shouldBeString();
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
				value:"All work and no play makes Jack a dull boy all work and no play makes Jack a dull boy all work and no play makes Jack a dull boy ALL WORK AND NO PLAY MAKES JACK A DULL BOY"
			});
			var sourceBlob = Titanium.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'streamfile.txt').read();
			var sourceBlobStr = sourceBlob.toString();
			
			var dest = Ti.createBuffer({length:100});
			var destStream = Ti.Stream.createStream({source:dest, mode:Ti.Stream.MODE_WRITE});
			valueOf(destStream).shouldNotBeNull();
			
			var blobStream = Ti.Stream.createStream({source:sourceBlob, mode:Ti.Stream.MODE_READ});
			valueOf(blobStream).shouldNotBeNull();
			
			Ti.Stream.writeStream(blobStream, destStream, 10);
			for (var i=0; i < dest.length; i++) {
				valueOf(dest[i]).shouldBeExactly(sourceBlobStr.charCodeAt(i));
			}
			
			var destStream2 = Ti.Stream.createStream({source:dest, mode:Ti.Stream.MODE_WRITE});
			valueOf(destStream2).shouldNotBeNull();
			
			var bufferStream = Ti.Stream.createStream({source:sourceBuffer, mode:Ti.Stream.MODE_READ});
			valueOf(bufferStream).shouldNotBeNull();
			
			Ti.Stream.writeStream(bufferStream, destStream2, 20, this.async(function(e) {
				valueOf(e.errorState).shouldBeNumber();
				valueOf(e.errorDescription).shouldBeString();
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
				value:"All work and no play makes Jack a dull boy all work and no play makes Jack a dull boy all work and no play makes Jack a dull boy ALL WORK AND NO PLAY MAKES JACK A DULL BOY"
			});
			var sourceBlob = Titanium.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'streamfile.txt').read();
			var sourceBlobStr = sourceBlob.toString();
		
			var chunksize = 20;
			var totalsize = 0;
			var sourceValue = null; // Used as a function for handling comparison
			
			function handler(e) {
				valueOf(e.errorState).shouldBeNumber();
				valueOf(e.errorDescription).shouldBeString();
				valueOf(e.bytesProcessed).shouldBeLessThanEqual(chunksize);
				valueOf(e.buffer).shouldNotBeNull();

				for (var i=0; i < e.buffer.length; i++) {
					valueOf(e.buffer[i]).shouldBeExactly(sourceValue(i,totalsize));
				}

				if (e.bytesProcessed != -1) {
					totalsize += e.bytesProcessed;
				}
				valueOf(totalsize).shouldBeExactly(e.totalBytesProcessed);
			}
			
			sourceValue = function(pos, totalsize) {
				return sourceBuffer[totalsize+pos];
			};
			var bufferStream = Ti.Stream.createStream({source:sourceBuffer, mode:Ti.Stream.MODE_READ});
			valueOf(bufferStream).shouldNotBeNull();

			// Synch pump
			Ti.Stream.pump(bufferStream, handler, chunksize);

			sourceValue = function(pos, totalsize) {
				return sourceBlobStr.charCodeAt(pos+totalsize);
			};
			var blobStream = Ti.Stream.createStream({source:sourceBlob, mode:Ti.Stream.MODE_READ});
			valueOf(blobStream).shouldNotBeNull();

			// Asynch pump
			totalsize = 0;
			Ti.Stream.pump(blobStream, this.async(handler), chunksize, true);
		},
		timeout: 10000,
		timeoutError: "Timed out waiting for pump"
	}),
});