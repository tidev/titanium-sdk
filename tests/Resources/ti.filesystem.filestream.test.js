/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';

var should = require('./utilities/assertions');

describe('Titanium.Filesystem.FileStream', function () {

	before(function () {
		// prepare resource
		var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'stream_test_in.txt');
		if (file.exists()) {
			file.deleteFile();
		}
		file.write('Remember, remember the 5th of November.\nThe gunpowder treason and plot.\nI know of no reason why the gunpowder treason should ever be forgot.');

		file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'stream_test_out.txt');
		if (file.exists()) {
			file.deleteFile();
		}

		file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'stream_test_truncate.txt');
		if (file.exists()) {
			file.deleteFile();
		}

		file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'fsappendtest.jpg');
		if (file.exists()) {
			file.deleteFile();
		}

		file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'fswritetest.jpg');
		if (file.exists()) {
			file.deleteFile();
		}

		file = null;
	});

	it('apiName', function (finish) {
		var resourceFileStream = Ti.Filesystem.openStream(Ti.Filesystem.MODE_READ, Ti.Filesystem.applicationDataDirectory, 'stream_test_in.txt');
		try {
			should(resourceFileStream).have.a.readOnlyProperty('apiName').which.is.a.String();
			should(resourceFileStream.apiName).be.eql('Ti.Filesystem.FileStream');
			finish();
		} catch (err) {
			finish(err);
		} finally {
			resourceFileStream.close();
		}
	});

	it('fileStreamBasicTest', function () {
		should(Ti.createBuffer).be.a.Function();
		should(Ti.Filesystem.openStream).be.a.Function();
		var resourceFileStream = Ti.Filesystem.openStream(Ti.Filesystem.MODE_READ, Ti.Filesystem.applicationDataDirectory, 'stream_test_in.txt');
		should(resourceFileStream).be.an.Object();
		should(resourceFileStream.read).be.a.Function();
		should(resourceFileStream.write).be.a.Function();
		should(resourceFileStream.apiName).be.eql('Ti.Filesystem.FileStream');
		var inBuffer = Ti.createBuffer();
		should(inBuffer).be.an.Object();
		var tempBufferLength = 50;
		var tempBuffer = Ti.createBuffer({
			length: tempBufferLength
		});
		should(tempBuffer).be.an.Object();
		should(tempBuffer.length).eql(tempBufferLength);
		var bytesRead = resourceFileStream.read(tempBuffer);
		for (;bytesRead > -1;) {
			Ti.API.info('bytes read ' + bytesRead);
			// buffer is expanded to contain the new data and the length is updated to reflect this
			var previousData = inBuffer.toString();
			inBuffer.append(tempBuffer);
			// assert that the append worked correctly
			should(previousData + tempBuffer.toString()).eql(inBuffer.toString());
			// clear the buffer rather than creating a new temp one
			tempBuffer.clear();
			bytesRead = resourceFileStream.read(tempBuffer);
		}
		resourceFileStream.close();
		// assert that we can read/write successfully from the out file.
		var appDataFileOutStream = Ti.Filesystem.openStream(Ti.Filesystem.MODE_WRITE, Ti.Filesystem.applicationDataDirectory, 'stream_test_out.txt');
		appDataFileOutStream.write(inBuffer);
		// write inBuffer to outfile
		appDataFileOutStream.close();
		var outBuffer = Ti.createBuffer({
			length: 50
		});
		// have to set length on read buffer or no data will be read
		var appDataFileInStream = Ti.Filesystem.openStream(Ti.Filesystem.MODE_READ, Ti.Filesystem.applicationDataDirectory, 'stream_test_out.txt');
		bytesRead = appDataFileInStream.read(outBuffer);
		// read 50 byes of data from outfile into outBuffer
		appDataFileInStream.close();
		for (var i = 0; bytesRead > i; i++) {
			should(inBuffer[i]).be.equal(outBuffer[i]);
		}
	});

	it('fileStreamWriteTest', function () {
		var infile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'stream_test_in.txt');
		var instream = infile.open(Ti.Filesystem.MODE_READ);
		var outfile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'fswritetest.jpg');
		var outstream = outfile.open(Ti.Filesystem.MODE_WRITE);
		var buffer = Ti.createBuffer({
			length: 20
		});
		var totalWriteSize = 0;
		var size = 0;
		for (;(size = instream.read(buffer)) > -1;) {
			outstream.write(buffer, 0, size);
			totalWriteSize += size;
		}
		instream.close();
		outstream.close();
		infile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'fswritetest.jpg');
		instream = infile.open(Ti.Filesystem.MODE_READ);
		var inBuffer = Ti.Stream.readAll(instream);
		var totalReadSize = inBuffer.length;
		should(totalReadSize).be.equal(totalWriteSize);
		instream.close();
	});

	it('fileStreamAppendTest', function () {
		var infile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'stream_test_in.txt');
		var instream = infile.open(Ti.Filesystem.MODE_READ);
		var outfile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'fsappendtest.jpg');
		if (outfile.exists()) {
			outfile.deleteFile();
		}
		var outstream = outfile.open(Ti.Filesystem.MODE_WRITE);
		var bytesStreamed = Ti.Stream.writeStream(instream, outstream, 40);
		instream.close();
		outstream.close();
		infile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'stream_test_in.txt');
		instream = infile.open(Ti.Filesystem.MODE_READ);
		var appendfile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'fsappendtest.jpg');
		var appendstream = appendfile.open(Ti.Filesystem.MODE_APPEND);
		var buffer = Ti.createBuffer({
			length: 20
		});
		var totalWriteSize = 0;
		var size = 0;
		for (;(size = instream.read(buffer)) > -1;) {
			appendstream.write(buffer, 0, size);
			totalWriteSize += size;
		}
		instream.close();
		appendstream.close();
		infile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'fsappendtest.jpg');
		instream = infile.open(Ti.Filesystem.MODE_READ);
		var inBuffer = Ti.Stream.readAll(instream);
		var totalReadSize = inBuffer.length;
		Ti.API.info('Total read size: ' + totalReadSize);
		Ti.API.info('Streamed: ' + bytesStreamed);
		Ti.API.info('Total write size: ' + totalWriteSize);
		should(totalReadSize).be.equal(bytesStreamed + totalWriteSize);
		instream.close();
	});

	it('fileStreamPumpTest', function (finish) {
		this.timeout(5000);
		var pumpInputFile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'stream_test_in.txt');
		should(pumpInputFile).be.an.Object();
		should(pumpInputFile.open).be.a.Function();
		should(pumpInputFile.exists()).be.true();
		var step = 10;
		var pumpTotal = 0;
		function pumpCallback(e) {
			if (e.bytesProcessed != -1) { // eslint-disable-line eqeqeq
				Ti.API.info('Received data chunk of size <' + e.bytesProcessed + '>');
				Ti.API.info('Received buffer <' + e.buffer + '>');
				Ti.API.info('Total bytes received thus far <' + e.totalBytesProcessed + '>');
				should(e.bytesProcessed).eql(step);
				should(e.totalBytesProcessed).eql(step + pumpTotal);
				pumpTotal += e.bytesProcessed;
			} else { // EOF
				Ti.API.info('Reached EOF in pumpCallback');
				finish();
			}
		}
		var pumpStream = pumpInputFile.open(Ti.Filesystem.MODE_READ);
		should(pumpStream).be.an.Object();
		Ti.Stream.pump(pumpStream, pumpCallback, step);
		pumpStream.close();
	});

	it('fileStreamWriteStreamTest', function () {
		var inBuffer = Ti.createBuffer({
				value: 'huray for data, lets have a party for data1 huray for data, lets have a party for data2 huray for data, lets have a party for data3'
			}),
			inStream,
			outFileStream,
			bytesWritten;

		should(inBuffer).be.an.Object();

		inStream = Ti.Stream.createStream({
			source: inBuffer,
			mode: Ti.Stream.MODE_READ
		});
		should(inStream).not.be.null();

		outFileStream = Ti.Filesystem.openStream(Ti.Filesystem.MODE_WRITE, Ti.Filesystem.applicationDataDirectory, 'stream_test_out.txt');
		should(outFileStream).be.an.Object();

		// writes all data from inBufferStream to outFileStream in chunks of 30
		bytesWritten = Ti.Stream.writeStream(inStream, outFileStream, 30);
		Ti.API.info('<' + bytesWritten + '> bytes written, closing both streams');
		// assert that the length of the outBuffer is equal to the amount of bytes that were written
		should(bytesWritten).eql(inBuffer.length);
		outFileStream.close();
	});

	it('fileStreamTruncateTest', function () {
		var inBuffer = Ti.createBuffer({
				value: 'huray for data, lets have a party for data1 huray for data, lets have a party for data2 huray for data, lets have a party for data3'
			}),
			inStream,
			outFileStream,
			bytesWritten,
			outFileStream2,
			inFileStream,
			truncateBuffer;

		should(inBuffer).be.an.Object();

		inStream = Ti.Stream.createStream({
			source: inBuffer,
			mode: Ti.Stream.MODE_READ
		});
		should(inStream).not.be.null();

		outFileStream = Ti.Filesystem.openStream(Ti.Filesystem.MODE_WRITE, Ti.Filesystem.applicationDataDirectory, 'stream_test_truncate.txt');
		should(outFileStream).be.an.Object();

		// writes all data from inBufferStream to outFileStream in chunks of 30
		bytesWritten = Ti.Stream.writeStream(inStream, outFileStream, 30);
		Ti.API.info('<' + bytesWritten + '> bytes written, closing both streams');
		// assert that the length of the outBuffer is equal to the amount of bytes that were written
		should(bytesWritten).eql(inBuffer.length);
		outFileStream.close();

		outFileStream2 = Ti.Filesystem.openStream(Ti.Filesystem.MODE_WRITE, Ti.Filesystem.applicationDataDirectory, 'stream_test_truncate.txt');
		should(outFileStream2).be.an.Object();
		outFileStream2.close();

		inFileStream = Ti.Filesystem.openStream(Ti.Filesystem.MODE_READ, Ti.Filesystem.applicationDataDirectory, 'stream_test_truncate.txt');
		should(inFileStream).be.an.Object();
		truncateBuffer = Ti.Stream.readAll(inFileStream);
		should(truncateBuffer.length).be.equal(0);
		inFileStream.close();
	});
});
