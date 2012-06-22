/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

module.exports = new function() {
	var finish;
	var valueOf;
	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "stream";
	this.tests = [
		{name: "before_all"},
		{name: "basicBufferStream"},
		{name: "basicBlobStream"},
		{name: "asyncRead", timeout: 10000},
		{name: "asyncWrite", timeout: 10000},
		{name: "readAll", timeout: 10000},
		{name: "writeStream", timeout: 10000},
		{name: "pump", timeout: 10000}
	]

	this.before_all = function(testRun) {
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

		finish(testRun);
	}

	this.basicBufferStream = function(testRun) {
		var rstream = null;
		var wstream = null;
		var astream = null;
		var sourceBuffer = this.sourceBuffer;

		// create read stream
		valueOf(testRun, function() {
			rstream = Ti.Stream.createStream({source: sourceBuffer, mode: Ti.Stream.MODE_READ});
		}).shouldNotThrowException();
		valueOf(testRun, rstream).shouldNotBeNull();
		
		for (var i=0; i < this.streamFuncs.length; i++) {
			var func = rstream[this.streamFuncs[i]];
			valueOf(testRun, func).shouldBeFunction();
		}
		
		valueOf(testRun, rstream.isReadable()).shouldBeTrue();
		valueOf(testRun, rstream.isWritable()).shouldBeFalse();

		// create write stream
		valueOf(testRun, function() {
			wstream = Ti.Stream.createStream({source: sourceBuffer, mode: Ti.Stream.MODE_WRITE});
		}).shouldNotThrowException();
		valueOf(testRun, wstream).shouldNotBeNull();
		
		for (var i=0; i < this.streamFuncs.length; i++) {
			var func = wstream[this.streamFuncs[i]];
			valueOf(testRun, func).shouldBeFunction();
		}
		
		valueOf(testRun, wstream.isReadable()).shouldBeFalse();
		valueOf(testRun, wstream.isWritable()).shouldBeTrue();

		// create append stream
		valueOf(testRun, function() {
			astream = Ti.Stream.createStream({source: sourceBuffer, mode: Ti.Stream.MODE_APPEND});
		}).shouldNotThrowException();
		valueOf(testRun, astream).shouldNotBeNull();
		
		for (var i=0; i < this.streamFuncs.length; i++) {
			var func = astream[this.streamFuncs[i]];
			valueOf(testRun, func).shouldBeFunction();
		}
		
		valueOf(testRun, astream.isReadable()).shouldBeFalse();
		valueOf(testRun, astream.isWritable()).shouldBeTrue();


		var destBuffer = Ti.createBuffer({length:30});
		var readBytes = rstream.read(destBuffer, 0, 20);
		valueOf(testRun, readBytes).shouldBeExactly(20);
		for (var i=0; i < readBytes; i++) {
			valueOf(testRun, sourceBuffer[i]).shouldBeExactly(destBuffer[i]);
		}

		var writeBytes = wstream.write(destBuffer, 0, destBuffer.length);
		valueOf(testRun, writeBytes).shouldBeExactly(destBuffer.length);
		for (var i=0; i < writeBytes; i++) {
			valueOf(testRun, sourceBuffer[i]).shouldBeExactly(destBuffer[i]);
		}

		var appendBuffer = Ti.createBuffer({value:"appendme"});
		var appendBytes = astream.write(appendBuffer, 0, appendBuffer.length);
		valueOf(testRun, appendBytes).shouldBeExactly(appendBuffer.length);
		for (var i=0; i < appendBytes; i++) {
			valueOf(testRun, sourceBuffer[(sourceBuffer.length - appendBuffer.length)+i]).shouldBeExactly(appendBuffer[i]);
		}

		valueOf(testRun, function() {astream.close()}).shouldNotThrowException();

		finish(testRun);
	}

	this.basicBlobStream = function(testRun) {
		var stream = null;
		var sourceBlob = this.sourceBlob;

		valueOf(testRun, function() {
			stream = Ti.Stream.createStream({source: sourceBlob, mode: Ti.Stream.MODE_READ});
		}).shouldNotThrowException();
		valueOf(testRun, stream).shouldNotBeNull();
		
		for (var i=0; i < this.streamFuncs.length; i++) {
			var func = stream[this.streamFuncs[i]];
			valueOf(testRun, func).shouldBeFunction();
		}
		
		valueOf(testRun, stream.isReadable()).shouldBeTrue();
		valueOf(testRun, stream.isWritable()).shouldBeFalse();
		
		var destBuffer = Ti.createBuffer({length:50});
		var readBytes = stream.read(destBuffer, 0, 20);
		valueOf(testRun, readBytes).shouldBeExactly(20);
		var str = sourceBlob.toString();
		for (var i=0; i < 20; i++) {
			valueOf(testRun, str.charCodeAt(i)).shouldBeExactly(destBuffer[i]);
		}

		// read again to ensure position on blob is maintained
		readBytes = stream.read(destBuffer, 20, 20);
		valueOf(testRun, readBytes).shouldBeExactly(20);
		for (var i=0; i < 20; i++) {
			valueOf(testRun, str.charCodeAt(20 + i)).shouldBeExactly(destBuffer[ 20 + i]);
		}

		valueOf(testRun, function() {stream.close()}).shouldNotThrowException();

		finish(testRun);
	}

	this.asyncRead = function(testRun) {
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
		valueOf(testRun, bufferStream).shouldNotBeNull();
		var dest = Ti.createBuffer({length:50});
		valueOf(testRun, dest).shouldNotBeNull();
	
		// Perform read(source,dest,callback)
		Ti.Stream.read(bufferStream, dest, function(e) {
			valueOf(testRun, e.errorState).shouldBeNumber();
			valueOf(testRun, e.errorDescription).shouldBeString();
			valueOf(testRun, e.bytesProcessed).shouldBeExactly(dest.length);				
	
			for (var i=0; i < dest.length; i++) {
				valueOf(testRun, dest[i]).shouldBeExactly(sourceBuffer[i]);
			}
			finished = true;
		});

		var offset = 10;
		var length = 20;
		var blobStream = Ti.Stream.createStream({source: sourceBlob, mode: Ti.Stream.MODE_READ});
		valueOf(testRun, blobStream).shouldNotBeNull();
		var blobStr = sourceBlob.toString();

		// Performing the second read while the first read is happening
		// mungs data that gets checked in the callback...
		// have to busywait until the FIRST async call is done.
		var timer = null;
		var callback = function(e) {
			valueOf(testRun, e.errorState).shouldBeNumber();
			valueOf(testRun, e.errorDescription).shouldBeString();
			valueOf(testRun, e.bytesProcessed).shouldBeExactly(length);				

			for (var i=0; i < length; i++) {
				valueOf(testRun, dest[i+offset]).shouldBeExactly(blobStr.charCodeAt(i));
			}

			finish(testRun);
		};

		function spinWait() {
			if (!finished) {
				timer = setTimeout(spinWait, 200);
			}
			else {
				Ti.Stream.read(blobStream, dest, offset, length, callback);
			}
		}
		timer = setTimeout(spinWait, 200);
	}

	this.asyncWrite = function(testRun) {
		// This stuff has to be copied into each asynch test because it lives
		// in a different 'this' context
		var sourceBuffer = Ti.createBuffer({
			value:"All work and no play makes Jack a dull boy all work and no play makes Jack a dull boy all work and no play makes Jack a dull boy ALL WORK AND NO PLAY MAKES JACK A DULL BOY"
		});

		var dest = Ti.createBuffer({length:sourceBuffer.length});
		valueOf(testRun, dest).shouldNotBeNull();
		var bufferStream = Ti.Stream.createStream({source:dest, mode: Ti.Stream.MODE_WRITE});
		valueOf(testRun, bufferStream).shouldNotBeNull();
	
		var offset = 10;
		var length = 20;
		var finished = false;
	
		// Need to perform offset/length write first so that the destination buffer doesn't fill
		Ti.Stream.write(bufferStream, sourceBuffer, offset, length, function(e) {
			valueOf(testRun, e.errorState).shouldBeNumber();
			valueOf(testRun, e.errorDescription).shouldBeString();
			valueOf(testRun, e.bytesProcessed).shouldBeExactly(length);
	
			for (var i=0; i < length; i++) {
				valueOf(testRun, dest[i]).shouldBeExactly(sourceBuffer[i+offset]);
			}
	
			finished = true;
		});
	
		// We can't have a 'this.async' inside of another callback, so we
		// have to busywait until the FIRST async call is done.
		var timer = null;
		var callback = function(e) {
			valueOf(testRun, e.errorState).shouldBeNumber();
			valueOf(testRun, e.errorDescription).shouldBeString();
			valueOf(testRun, e.bytesProcessed).shouldBeExactly(sourceBuffer.length);
	
			for (var i=0; i < dest.length - length; i++) {
				valueOf(testRun, dest[i+length]).shouldBeExactly(sourceBuffer[i]);
			}

			finish(testRun);
		};
	
		function spinWait() {
			if (!finished) {
				timer = setTimeout(spinWait, 200);
			}
			else {
				Ti.Stream.write(bufferStream, sourceBuffer, callback);
			}
		}
		timer = setTimeout(spinWait, 200);
	}

	this.readAll = function(testRun) {
		// This stuff has to be copied into each asynch test because it lives
		// in a different 'this' context
		var sourceBuffer = Ti.createBuffer({
			value:"All work and no play makes Jack a dull boy all work and no play makes Jack a dull boy all work and no play makes Jack a dull boy ALL WORK AND NO PLAY MAKES JACK A DULL BOY"
		});
		var sourceBlob = Titanium.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'streamfile.txt').read();
		var sourceBlobStr = sourceBlob.toString();

		var bufferStream = Ti.Stream.createStream({source:sourceBuffer, mode:Ti.Stream.MODE_READ});
		valueOf(testRun, bufferStream).shouldNotBeNull();

		var buffer;
		function assignBuffer() {
			buffer = Ti.Stream.readAll(bufferStream);
		}
		valueOf(testRun, assignBuffer).shouldNotThrowException();
		valueOf(testRun, buffer).shouldNotBeNull();
		valueOf(testRun, buffer.length).shouldBeExactly(sourceBuffer.length);

		for (var i=0; i < buffer.length; i++) {
			valueOf(testRun, buffer[i]).shouldBeExactly(sourceBuffer[i]);
		}

		var blobStream = Ti.Stream.createStream({source:sourceBlob, mode:Ti.Stream.MODE_READ});
		valueOf(testRun, blobStream).shouldNotBeNull();

		// TODO: Should we be required to create this buffer, or should it be autocreated?
		var dest = Ti.createBuffer({length:sourceBlobStr.length});
		valueOf(testRun, dest).shouldNotBeNull();

		Ti.Stream.readAll(blobStream, dest, function(e) {
			valueOf(testRun, e.errorState).shouldBeNumber();
			valueOf(testRun, e.errorDescription).shouldBeString();
			valueOf(testRun, e.bytesProcessed).shouldBeExactly(sourceBlobStr.length);

			for (var i=0; i < dest.length; i++) {
				valueOf(testRun, dest[i]).shouldBeExactly(sourceBlobStr.charCodeAt(i));
			}

			finish(testRun);
		});
	}

	this.writeStream = function(testRun) {
		// This stuff has to be copied into each asynch test because it lives
		// in a different 'this' context
		var sourceBuffer = Ti.createBuffer({
			value:"All work and no play makes Jack a dull boy all work and no play makes Jack a dull boy all work and no play makes Jack a dull boy ALL WORK AND NO PLAY MAKES JACK A DULL BOY"
		});
		var sourceBlob = Titanium.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'streamfile.txt').read();
		var sourceBlobStr = sourceBlob.toString();

		var dest = Ti.createBuffer({length:100});
		var destStream = Ti.Stream.createStream({source:dest, mode:Ti.Stream.MODE_WRITE});
		valueOf(testRun, destStream).shouldNotBeNull();

		var blobStream = Ti.Stream.createStream({source:sourceBlob, mode:Ti.Stream.MODE_READ});
		valueOf(testRun, blobStream).shouldNotBeNull();

		Ti.Stream.writeStream(blobStream, destStream, 10);
		for (var i=0; i < dest.length; i++) {
			valueOf(testRun, dest[i]).shouldBeExactly(sourceBlobStr.charCodeAt(i));
		}

		var destStream2 = Ti.Stream.createStream({source:dest, mode:Ti.Stream.MODE_WRITE});
		valueOf(testRun, destStream2).shouldNotBeNull();

		var bufferStream = Ti.Stream.createStream({source:sourceBuffer, mode:Ti.Stream.MODE_READ});
		valueOf(testRun, bufferStream).shouldNotBeNull();

		Ti.Stream.writeStream(bufferStream, destStream2, 20, function(e) {
			valueOf(testRun, e.errorState).shouldBeNumber();
			valueOf(testRun, e.errorDescription).shouldBeString();
			valueOf(testRun, e.bytesProcessed).shouldBeExactly(dest.length);				

			for (var i=0; i < dest.length; i++) {
				valueOf(testRun, sourceBuffer[i]).shouldBeExactly(dest[i]);
			}

			finish(testRun);
		});
	}

	this.pump = function(testRun) {
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

		var numOfPass = 0;
		
		function handler(e) {
			valueOf(testRun, e.errorState).shouldBeNumber();
			valueOf(testRun, e.errorDescription).shouldBeString();
			valueOf(testRun, e.bytesProcessed).shouldBeLessThanEqual(chunksize);
			valueOf(testRun, e.buffer).shouldNotBeNull();

			for (var i=0; i < e.buffer.length; i++) {
				valueOf(testRun, e.buffer[i]).shouldBeExactly(sourceValue(i,totalsize));
			}

			if (e.bytesProcessed != -1) {
				totalsize += e.bytesProcessed;
			}
			valueOf(testRun, totalsize).shouldBeExactly(e.totalBytesProcessed);

			numOfPass += 1;
			if (numOfPass == 2) {
				finish(testRun);
			}
		}

		sourceValue = function(pos, totalsize) {
			return sourceBuffer[totalsize+pos];
		};
		var bufferStream = Ti.Stream.createStream({source:sourceBuffer, mode:Ti.Stream.MODE_READ});
		valueOf(testRun, bufferStream).shouldNotBeNull();

		// Synch pump
		Ti.Stream.pump(bufferStream, handler, chunksize);

		sourceValue = function(pos, totalsize) {
			return sourceBlobStr.charCodeAt(pos+totalsize);
		};
		var blobStream = Ti.Stream.createStream({source:sourceBlob, mode:Ti.Stream.MODE_READ});
		valueOf(testRun, blobStream).shouldNotBeNull();

		// Asynch pump
		totalsize = 0;
		Ti.Stream.pump(blobStream, handler, chunksize, true);
	}
}
