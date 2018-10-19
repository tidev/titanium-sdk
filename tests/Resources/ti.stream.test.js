/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Titanium.Stream', function () {
	before(function () {
		var file;
		// createBuffer should be tested by Ti.Buffer
		this.sourceBuffer = Ti.createBuffer({
			value: 'All work and no play makes Jack a dull boy all work and no play makes Jack a dull boy all work and no play makes Jack a dull boy ALL WORK AND NO PLAY MAKES JACK A DULL BOY'
		});
		// create file to work with
		file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'streamfile.txt');
		if (file.exists()) {
			file.deleteFile();
		}
		file.write('This is my text1 This is my text2 This is my text3 This is my text4 This is my text5 This is my text6 This is my text7');
		file = null;
		this.sourceBlob = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'streamfile.txt').read();
		this.sourceBlobStr = this.sourceBlob.toString();
		this.streamFuncs = [ 'read', 'write', 'isReadable', 'isWritable' ];
	});

	// FIXME Get working on IOS
	it.iosBroken('basicBufferStream', function () {
		var rstream = null,
			wstream = null,
			astream = null,
			sourceBuffer = this.sourceBuffer,
			i,
			func,
			destBuffer,
			readBytes,
			writeBytes,
			appendBuffer,
			appendBytes;
		// create read stream
		should(function () {
			rstream = Ti.Stream.createStream({
				source: sourceBuffer,
				mode: Ti.Stream.MODE_READ
			});
		}).not.throw();
		should(rstream).not.be.null;
		should(rstream.apiName).be.eql('Ti.BufferStream'); // iOS is returning Ti.IOStream
		for (i = 0; i < this.streamFuncs.length; i++) {
			func = rstream[this.streamFuncs[i]];
			should(func).be.a.Function;
		}
		should(rstream.isReadable()).be.true;
		should(rstream.isWritable()).be.false;
		// create write stream
		should(function () {
			wstream = Ti.Stream.createStream({
				source: sourceBuffer,
				mode: Ti.Stream.MODE_WRITE
			});
		}).not.throw();
		should(wstream).not.be.null;
		for (i = 0; i < this.streamFuncs.length; i++) {
			func = wstream[this.streamFuncs[i]];
			should(func).be.a.Function;
		}
		should(wstream.isReadable()).be.false;
		should(wstream.isWritable()).be.true;
		// create append stream
		should(function () {
			astream = Ti.Stream.createStream({
				source: sourceBuffer,
				mode: Ti.Stream.MODE_APPEND
			});
		}).not.throw();
		should(astream).not.be.null;
		for (i = 0; i < this.streamFuncs.length; i++) {
			func = astream[this.streamFuncs[i]];
			should(func).be.a.Function;
		}
		should(astream.isReadable()).be.false;
		should(astream.isWritable()).be.true;
		destBuffer = Ti.createBuffer({
			length: 30
		});
		readBytes = rstream.read(destBuffer, 0, 20);
		should(readBytes).be.equal(20);
		for (i = 0; readBytes > i; i++) {
			should(sourceBuffer[i]).be.equal(destBuffer[i]);
		}
		writeBytes = wstream.write(destBuffer, 0, destBuffer.length);
		should(writeBytes).be.equal(destBuffer.length);
		for (i = 0; writeBytes > i; i++) {
			should(sourceBuffer[i]).be.equal(destBuffer[i]);
		}
		appendBuffer = Ti.createBuffer({
			value: 'appendme'
		});
		appendBytes = astream.write(appendBuffer, 0, appendBuffer.length);
		should(appendBytes).be.equal(appendBuffer.length);
		for (i = 0; appendBytes > i; i++) {
			should(sourceBuffer[sourceBuffer.length - appendBuffer.length + i]).be.equal(appendBuffer[i]);
		}
		should(function () {
			astream.close();
		}).not.throw();
	});

	it('basicBlobStream', function () {
		var stream = null,
			sourceBlob = this.sourceBlob,
			i,
			func,
			destBuffer,
			readBytes,
			str;
		should(function () {
			stream = Ti.Stream.createStream({
				source: sourceBlob,
				mode: Ti.Stream.MODE_READ
			});
		}).not.throw();
		should(stream).not.be.null;
		for (i = 0; i < this.streamFuncs.length; i++) {
			func = stream[this.streamFuncs[i]];
			should(func).be.a.Function;
		}
		should(stream.isReadable()).be.true;
		should(stream.isWritable()).be.false;
		destBuffer = Ti.createBuffer({
			length: 50
		});
		readBytes = stream.read(destBuffer, 0, 20);
		should(readBytes).be.equal(20);
		str = sourceBlob.text;
		for (i = 0; i < 20; i++) {
			should(str.charCodeAt(i)).be.equal(destBuffer[i]);
		}
		// read again to ensure position on blob is maintained
		readBytes = stream.read(destBuffer, 20, 20);
		should(readBytes).be.equal(20);
		for (i = 0; i < 20; i++) {
			should(str.charCodeAt(20 + i)).be.equal(destBuffer[20 + i]);
		}
		should(function () {
			stream.close();
		}).not.throw();
	});

	// FIXME Get working on IOS
	it.iosBroken('asyncRead', function (finish) {
		var sourceBuffer,
			sourceBlob,
			// sourceBlobStr,
			bufferStream,
			dest,
			offset = 10,
			length = 20,
			blobStream,
			blobStr,
			finished = false;
		this.timeout(1e4);
		// This stuff has to be copied into each asynch test because it lives
		// in a different 'this' context
		sourceBuffer = Ti.createBuffer({
			value: 'All work and no play makes Jack a dull boy all work and no play makes Jack a dull boy all work and no play makes Jack a dull boy ALL WORK AND NO PLAY MAKES JACK A DULL BOY'
		});
		sourceBlob = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'streamfile.txt').read();
		// sourceBlobStr = sourceBlob.toString();
		// read(source,dest,callback) on BufferStream
		bufferStream = Ti.Stream.createStream({
			source: sourceBuffer,
			mode: Ti.Stream.MODE_READ
		});
		should(bufferStream).not.be.null;
		dest = Ti.createBuffer({
			length: 50
		});
		should(dest).not.be.null;
		// Perform read(source,dest,callback)
		Ti.Stream.read(bufferStream, dest, function (e) {
			var i;
			should(e.code).be.a.Number;
			should(e.success).be.a.Boolean;
			should(e.bytesProcessed).be.equal(dest.length);
			for (i = 0; i < dest.length; i++) {
				should(dest[i]).be.equal(sourceBuffer[i]);
			}
			finished = true;
		});

		blobStream = Ti.Stream.createStream({
			source: sourceBlob,
			mode: Ti.Stream.MODE_READ
		});
		should(blobStream).not.be.null;
		should(blobStream.apiName).be.eql('Ti.BlobStream'); // iOS is returning Ti.IOStream
		blobStr = sourceBlob.toString();
		// Performing the second read while the first read is happening
		// mungs data that gets checked in the callback...
		// have to busywait until the FIRST async call is done.
		function callback(e) {
			var i;
			should(e.code).be.a.Number;
			should(e.success).be.a.Boolean;
			should(e.bytesProcessed).be.equal(length);
			for (i = 0; length > i; i++) {
				should(dest[i + offset]).be.equal(blobStr.charCodeAt(i));
			}
			finish();
		}
		function spinWait() {
			if (!finished) {
				setTimeout(spinWait, 200);
			} else {
				Ti.Stream.read(blobStream, dest, offset, length, callback);
			}
		}
		setTimeout(spinWait, 200);
	});

	// FIXME this test crashes ios! Fix the test or open a JIRA!
	it.iosBroken('asyncWrite', function (finish) {
		var sourceBuffer,
			dest,
			bufferStream,
			offset = 10,
			length = 20,
			finished = false;
		this.timeout(1e4);
		// This stuff has to be copied into each asynch test because it lives
		// in a different 'this' context
		sourceBuffer = Ti.createBuffer({
			value: 'All work and no play makes Jack a dull boy all work and no play makes Jack a dull boy all work and no play makes Jack a dull boy ALL WORK AND NO PLAY MAKES JACK A DULL BOY'
		});
		dest = Ti.createBuffer({
			length: sourceBuffer.length
		});
		should(dest).not.be.null;

		bufferStream = Ti.Stream.createStream({
			source: dest,
			mode: Ti.Stream.MODE_WRITE
		});
		should(bufferStream).not.be.null;

		// Need to perform offset/length write first so that the destination buffer doesn't fill
		Ti.Stream.write(bufferStream, sourceBuffer, offset, length, function (e) {
			var i;
			should(e.code).be.a.Number;
			should(e.success).be.a.Boolean;
			should(e.bytesProcessed).be.equal(length);
			for (i = 0; length > i; i++) {
				should(dest[i]).be.equal(sourceBuffer[i + offset]);
			}
			finished = true;
		});
		// We can't have a 'this.async' inside of another callback, so we
		// have to busywait until the FIRST async call is done.
		function callback(e) {
			var i;
			should(e.code).be.a.Number;
			should(e.success).be.a.Boolean;
			should(e.bytesProcessed).be.equal(sourceBuffer.length);
			for (i = 0; i < dest.length - length; i++) {
				should(dest[i + length]).be.equal(sourceBuffer[i]);
			}
			finish();
		}
		function spinWait() {
			if (!finished) {
				setTimeout(spinWait, 200);
			} else {
				Ti.Stream.write(bufferStream, sourceBuffer, callback);
			}
		}
		setTimeout(spinWait, 200);
	});

	// FIXME this test crashes ios! Fix the test or open a JIRA!
	it.iosBroken('readAll', function (finish) {
		var sourceBuffer,
			sourceBlob,
			sourceBlobStr,
			bufferStream,
			buffer,
			i,
			blobStream,
			dest;
		this.timeout(1e4);
		// This stuff has to be copied into each asynch test because it lives
		// in a different 'this' context
		sourceBuffer = Ti.createBuffer({
			value: 'All work and no play makes Jack a dull boy all work and no play makes Jack a dull boy all work and no play makes Jack a dull boy ALL WORK AND NO PLAY MAKES JACK A DULL BOY'
		});
		sourceBlob = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'streamfile.txt').read();
		sourceBlobStr = sourceBlob.toString();
		bufferStream = Ti.Stream.createStream({
			source: sourceBuffer,
			mode: Ti.Stream.MODE_READ
		});
		should(bufferStream).not.be.null;

		function assignBuffer() {
			buffer = Ti.Stream.readAll(bufferStream);
		}
		should(assignBuffer).not.throw();
		should(buffer).not.be.null;
		should(buffer.length).be.equal(sourceBuffer.length);
		for (i = 0; i < buffer.length; i++) {
			should(buffer[i]).be.equal(sourceBuffer[i]);
		}
		blobStream = Ti.Stream.createStream({
			source: sourceBlob,
			mode: Ti.Stream.MODE_READ
		});
		should(blobStream).not.be.null;
		// TODO: Should we be required to create this buffer, or should it be autocreated?
		dest = Ti.createBuffer({
			length: sourceBlobStr.length
		});
		should(dest).not.be.null;
		Ti.Stream.readAll(blobStream, dest, function (e) {
			var x;
			should(e.code).be.a.Number;
			should(e.success).be.a.Boolean;
			should(e.bytesProcessed).be.equal(sourceBlobStr.length);
			for (x = 0; x < dest.length; x++) {
				should(dest[x]).be.equal(sourceBlobStr.charCodeAt(x));
			}
			finish();
		});
	});

	// FIXME Get working on IOS. // iOS spits out: *** -[NSConcreteMutableData increaseLengthBy:]: absurd extra length: 18446744073709551526, maximum size: 9223372036854775808 bytes
	it.iosBroken('writeStream', function (finish) {
		var sourceBuffer,
			sourceBlob,
			sourceBlobStr,
			dest,
			destStream,
			blobStream,
			i,
			destStream2,
			bufferStream;
		this.timeout(1e4);
		// This stuff has to be copied into each asynch test because it lives
		// in a different 'this' context
		sourceBuffer = Ti.createBuffer({
			value: 'All work and no play makes Jack a dull boy all work and no play makes Jack a dull boy all work and no play makes Jack a dull boy ALL WORK AND NO PLAY MAKES JACK A DULL BOY'
		});
		sourceBlob = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'streamfile.txt').read();
		sourceBlobStr = sourceBlob.toString();
		dest = Ti.createBuffer({
			length: 100
		});
		destStream = Ti.Stream.createStream({
			source: dest,
			mode: Ti.Stream.MODE_WRITE
		});
		should(destStream).not.be.null;
		blobStream = Ti.Stream.createStream({
			source: sourceBlob,
			mode: Ti.Stream.MODE_READ
		});
		should(blobStream).not.be.null;
		Ti.Stream.writeStream(blobStream, destStream, 10);
		for (i = 0; i < dest.length; i++) {
			should(dest[i]).be.equal(sourceBlobStr.charCodeAt(i));
		}
		destStream2 = Ti.Stream.createStream({
			source: dest,
			mode: Ti.Stream.MODE_WRITE
		});
		should(destStream2).not.be.null;
		bufferStream = Ti.Stream.createStream({
			source: sourceBuffer,
			mode: Ti.Stream.MODE_READ
		});
		should(bufferStream).not.be.null;
		Ti.Stream.writeStream(bufferStream, destStream2, 20, function (e) {
			var x;
			should(e.code).be.a.Number;
			should(e.success).be.a.Boolean;
			should(e.bytesProcessed).be.equal(dest.length);
			for (x = 0; x < dest.length; x++) {
				should(sourceBuffer[x]).be.equal(dest[x]);
			}
			finish();
		});
	});

	it('pump', function (finish) {
		// This stuff has to be copied into each asynch test because it lives
		// in a different 'this' context
		var sourceBuffer = Ti.createBuffer({
				value: 'All work and no play makes Jack a dull boy all work and no play makes Jack a dull boy all work and no play makes Jack a dull boy ALL WORK AND NO PLAY MAKES JACK A DULL BOY'
			}),
			sourceBlob = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'streamfile.txt').read(),
			sourceBlobStr = sourceBlob.toString(),
			chunksize = 20,
			totalsize = 0,
			sourceValue = null,
			numOfPass = 0,
			error,
			bufferStream,
			blobStream;

		this.timeout(10000);

		// Used as a function for handling comparison
		function handler(e) {
			var i;
			try {
				should(e.code).be.a.Number;
				should(e.success).be.a.Boolean;
				should(e.bytesProcessed).be.within(0, chunksize);
				should(e.buffer).not.be.null;
				for (i = 0; i < e.buffer.length; i++) {
					should(e.buffer[i]).be.equal(sourceValue(i, totalsize));
				}
				if (e.bytesProcessed !== -1) {
					totalsize += e.bytesProcessed;
				}
				should(totalsize).be.equal(e.totalBytesProcessed);
			} catch (err) {
				error = err;
			}
			numOfPass += 1;
			if (numOfPass === 2) {
				finish(error);
			}
		}
		sourceValue = function (pos, totalsize) {
			return sourceBuffer[totalsize + pos];
		};

		bufferStream = Ti.Stream.createStream({
			source: sourceBuffer,
			mode: Ti.Stream.MODE_READ
		});
		should(bufferStream).not.be.null;

		// Synch pump
		Ti.Stream.pump(bufferStream, handler, chunksize);
		sourceValue = function (pos, totalsize) {
			return sourceBlobStr.charCodeAt(pos + totalsize);
		};
		blobStream = Ti.Stream.createStream({
			source: sourceBlob,
			mode: Ti.Stream.MODE_READ
		});
		should(blobStream).not.be.null;
		// Asynch pump
		totalsize = 0;
		Ti.Stream.pump(blobStream, handler, chunksize, true);
	});
});
