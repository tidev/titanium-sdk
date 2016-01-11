/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
var should = require('./should');

describe("filesystem", function() {
	it("optionalArgAPIs", function(finish) {
		// https://appcelerator.lighthouseapp.com/projects/32238/tickets/2211-android-filesystem-test-generates-runtime-error
		var newDir = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, "mydir");
		newDir.createDirectory();
		should(newDir.exists()).be.true;
		newDir.deleteDirectory();
		should(newDir.exists()).be.false;
		finish();
	});
	it("readWriteText", function(finish) {
		var TEXT = "This is my text";
		var FILENAME = "test.txt";
		var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, FILENAME);
		if (file.exists()) file.deleteFile();
		//TODO: What is the writability of a file that does not exist? The spec is silent on this.
		//Arguments can be made either way (True, we can write, false, no file exists)
		file.write(TEXT);
		should(file.writable).be.true;
		// nullify and re-create to test
		file = null;
		file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, FILENAME);
		should(file.exists()).be.true;
		var blob = file.read();
		should(blob).not.be.null;
		var readText = blob.text;
		should(readText).not.be.null;
		should(readText).not.be.type("undefined");
		should(readText).be.a.String;
		should(readText.length).eql(TEXT.length);
		should(readText).eql(TEXT);
		file.deleteFile();
		finish();
	});
	it("blobNativeFile", function(finish) {
		var filename = "blobtest";
		var testphrase = "Revenge of the Blob";
		var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, filename);
		if (file.exists()) file.deleteFile();
		file.write(testphrase);
		var blob = file.read();
		file = null;
		var path = blob.nativePath;
		file = Ti.Filesystem.getFile(path);
		should(file.exists()).be.true;
		var readphrase = file.read().text;
		should(readphrase).eql(testphrase);
		finish();
	});
	it("blobFile", function(finish) {
		var filename = "blobtest";
		var testphrase = "Revenge of the Blob";
		var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, filename);
		if (file.exists()) file.deleteFile();
		file.write(testphrase);
		var blob = file.read();
		var blobFile = blob.file;
		should(blobFile.nativePath).eql(file.nativePath);
		should(blobFile.exists()).be.true;
		var readphrase = blobFile.read().text;
		should(readphrase).eql(testphrase);
		file = null;
		finish();
	});
	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2443-android-paths-beginning-with-are-not-recognised#ticket-2443-6
	it("dotSlash", function(finish) {
		var f;
		var blob;
		should(function() {
			f = Ti.Filesystem.getFile("./txtFiles/file.txt");
		}).not.throw();
		//Resource files are readonly, but only on device, not simulator. As such, we can't test
		//the use case of where writable should be false.
		should(function() {
			blob = f.read();
		}).not.throw();
		var text;
		should(function() {
			text = blob.text;
		}).not.throw();
		should(text.length).be.greaterThan(0);
		finish();
	});
	it("appendStringTest", function(finish) {
		var f = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, "data.txt");
		should(f).not.be.null;
		var appended_text = "Some appended text";
		var previous_text = "";
		// Check if the file exists before trying to read from it!
		if (f.exists()) {
			var prev_blob;
			should(function() {
				prev_blob = f.read();
				previous_text = prev_blob.text;
			}).not.throw();
		}
		f.write(appended_text, true);
		var final_blob = f.read();
		should(final_blob).not.be.null;
		should(final_blob.text).eql(previous_text + appended_text);
		finish();
	});
	it("appendBlobTest", function(finish) {
		var blob = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, "txtFiles/file.txt").read();
		var dest = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, "append_blob.txt");
		should(blob).not.be.null;
		should(dest).not.be.null;
		var previous = "";
		if (dest.exists()) {
			var dest_blob = dest.read();
			should(dest_blob).not.be.null;
			previous = dest_blob.text;
		}
		dest.write(blob, true);
		var final_blob = dest.read();
		should(final_blob).not.be.null;
		should(final_blob.text).eql(previous + blob.text);
		finish();
	});
	it("appendFileTest", function(finish) {
		var source = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, "txtFiles/file.txt");
		var dest = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, "append_file.txt");
		var previous = "";
		should(source).not.be.null;
		should(dest).not.be.null;
		if (dest.exists()) previous = dest.read().text;
		dest.write(source, true);
		var source_blob = source.read();
		should(source_blob).not.be.null;
		var dest_blob = dest.read();
		should(dest_blob).not.be.null;
		should(dest_blob.text).eql(previous + source_blob.text);
		finish();
	});
	it("fileStreamBasicTest", function(finish) {
		should(Ti.createBuffer).be.a.Function;
		should(Ti.Filesystem.openStream).be.a.Function;
		var resourceFileStream = Ti.Filesystem.openStream(Ti.Filesystem.MODE_READ, Ti.Filesystem.resourcesDirectory, "txtFiles/stream_test_in.txt");
		should(resourceFileStream).be.an.Object;
		should(resourceFileStream.read).be.a.Function;
		should(resourceFileStream.write).be.a.Function;
		var inBuffer = Ti.createBuffer();
		should(inBuffer).be.an.Object;
		var tempBufferLength = 50;
		var tempBuffer = Ti.createBuffer({
			length: tempBufferLength
		});
		should(tempBuffer).be.an.Object;
		should(tempBuffer.length).eql(tempBufferLength);
		var bytesRead = resourceFileStream.read(tempBuffer);
		for (;bytesRead > -1; ) {
			Ti.API.info("bytes read " + bytesRead);
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
		var appDataFileOutStream = Ti.Filesystem.openStream(Ti.Filesystem.MODE_WRITE, Ti.Filesystem.applicationDataDirectory, "stream_test_out.txt");
		appDataFileOutStream.write(inBuffer);
		//write inBuffer to outfile
		appDataFileOutStream.close();
		var outBuffer = Ti.createBuffer({
			length: 50
		});
		// have to set length on read buffer or no data will be read
		var appDataFileInStream = Ti.Filesystem.openStream(Ti.Filesystem.MODE_READ, Ti.Filesystem.applicationDataDirectory, "stream_test_out.txt");
		bytesRead = appDataFileInStream.read(outBuffer);
		//read 50 byes of data from outfile into outBuffer
		appDataFileInStream.close();
		for (var i = 0; bytesRead > i; i++) should(inBuffer[i]).be.equal(outBuffer[i]);
		finish();
	});
	it("fileStreamWriteTest", function(finish) {
		var infile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, "txtFiles/stream_test_in.txt");
		var instream = infile.open(Ti.Filesystem.MODE_READ);
		var outfile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, "fswritetest.jpg");
		var outstream = outfile.open(Ti.Filesystem.MODE_WRITE);
		var buffer = Ti.createBuffer({
			length: 20
		});
		var totalWriteSize = 0;
		var size = 0;
		for (;(size = instream.read(buffer)) > -1; ) {
			outstream.write(buffer, 0, size);
			totalWriteSize += size;
		}
		instream.close();
		outstream.close();
		infile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, "fswritetest.jpg");
		instream = infile.open(Ti.Filesystem.MODE_READ);
		var inBuffer = Ti.Stream.readAll(instream);
		var totalReadSize = inBuffer.length;
		should(totalReadSize).be.equal(totalWriteSize);
		instream.close();
		finish();
	});
	it("fileStreamAppendTest", function(finish) {
		var infile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, "txtFiles/stream_test_in.txt");
		var instream = infile.open(Ti.Filesystem.MODE_READ);
		var outfile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, "fsappendtest.jpg");
		if (outfile.exists()) outfile.deleteFile();
		var outstream = outfile.open(Ti.Filesystem.MODE_WRITE);
		var bytesStreamed = Ti.Stream.writeStream(instream, outstream, 40);
		instream.close();
		outstream.close();
		infile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, "txtFiles/stream_test_in.txt");
		instream = infile.open(Ti.Filesystem.MODE_READ);
		var appendfile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, "fsappendtest.jpg");
		var appendstream = appendfile.open(Ti.Filesystem.MODE_APPEND);
		var buffer = Ti.createBuffer({
			length: 20
		});
		var totalWriteSize = 0;
		var size = 0;
		for (;(size = instream.read(buffer)) > -1; ) {
			appendstream.write(buffer, 0, size);
			totalWriteSize += size;
		}
		instream.close();
		appendstream.close();
		infile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, "fsappendtest.jpg");
		instream = infile.open(Ti.Filesystem.MODE_READ);
		var inBuffer = Ti.Stream.readAll(instream);
		var totalReadSize = inBuffer.length;
		Ti.API.info("Total read size: " + totalReadSize);
		Ti.API.info("Streamed: " + bytesStreamed);
		Ti.API.info("Total write size: " + totalWriteSize);
		should(totalReadSize).be.equal(bytesStreamed + totalWriteSize);
		instream.close();
		finish();
	});
	it("fileStreamPumpTest", function(finish) {
		var pumpInputFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, "txtFiles/stream_test_in.txt");
		should(pumpInputFile).be.an.Object;
		should(pumpInputFile.open).be.a.Function;
		should(pumpInputFile.exists()).be.true;
		var step = 10;
		var pumpTotal = 0;
		var pumpCallback = function(e) {
			if (e.bytesProcessed != -1) {
				Ti.API.info("Received data chunk of size <" + e.bytesProcessed + ">");
				Ti.API.info("Received buffer <" + e.buffer + ">");
				Ti.API.info("Total bytes received thus far <" + e.totalBytesProcessed + ">");
				should(e.bytesProcessed).eql(step);
				should(e.totalBytesProcessed).eql(step + pumpTotal);
				pumpTotal += e.bytesProcessed;
			} else //EOF
			Ti.API.info("Reached EOF in pumpCallback");
		};
		var pumpStream = pumpInputFile.open(Ti.Filesystem.MODE_READ);
		should(pumpStream).be.an.Object;
		Ti.Stream.pump(pumpStream, pumpCallback, step);
		pumpStream.close();
		finish();
	});
	it("fileStreamWriteStreamTest", function(finish) {
		var inBuffer = Ti.createBuffer({
			value: "huray for data, lets have a party for data1 huray for data, lets have a party for data2 huray for data, lets have a party for data3"
		});
		should(inBuffer).be.an.Object;
		var inStream = Ti.Stream.createStream({
			source: inBuffer,
			mode: Ti.Stream.MODE_READ
		});
		should(inStream).not.be.null;
		var outFileStream = Ti.Filesystem.openStream(Ti.Filesystem.MODE_WRITE, Ti.Filesystem.applicationDataDirectory, "stream_test_out.txt");
		should(outFileStream).be.an.Object;
		// writes all data from inBufferStream to outFileStream in chunks of 30
		var bytesWritten = Ti.Stream.writeStream(inStream, outFileStream, 30);
		Ti.API.info("<" + bytesWritten + "> bytes written, closing both streams");
		// assert that the length of the outBuffer is equal to the amount of bytes that were written
		should(bytesWritten).eql(inBuffer.length);
		outFileStream.close();
		finish();
	});
	it("fileStreamResourceFileTest", function(finish) {
		if ("android" === Ti.Platform.osname) {
			should(function() {
				Ti.Filesystem.openStream(Ti.Filesystem.MODE_WRITE, Ti.Filesystem.resourcesDirectory, "txtFiles/stream_test_in.txt");
			}).throw();
			should(function() {
				Ti.Filesystem.openStream(Ti.Filesystem.MODE_APPEND, Ti.Filesystem.resourcesDirectory, "txtFiles/stream_test_in.txt");
			}).throw();
			should(function() {
				var resourceFileStream = Ti.Filesystem.openStream(Ti.Filesystem.MODE_READ, Ti.Filesystem.resourcesDirectory, "txtFiles/stream_test_in.txt");
				resourceFileStream.close();
			}).not.throw();
		}
		finish();
	});
	it("fileStreamTruncateTest", function(finish) {
		var inBuffer = Ti.createBuffer({
			value: "huray for data, lets have a party for data1 huray for data, lets have a party for data2 huray for data, lets have a party for data3"
		});
		should(inBuffer).be.an.Object;
		var inStream = Ti.Stream.createStream({
			source: inBuffer,
			mode: Ti.Stream.MODE_READ
		});
		should(inStream).not.be.null;
		var outFileStream = Ti.Filesystem.openStream(Ti.Filesystem.MODE_WRITE, Ti.Filesystem.applicationDataDirectory, "stream_test_truncate.txt");
		should(outFileStream).be.an.Object;
		// writes all data from inBufferStream to outFileStream in chunks of 30
		var bytesWritten = Ti.Stream.writeStream(inStream, outFileStream, 30);
		Ti.API.info("<" + bytesWritten + "> bytes written, closing both streams");
		// assert that the length of the outBuffer is equal to the amount of bytes that were written
		should(bytesWritten).eql(inBuffer.length);
		outFileStream.close();
		var outFileStream = Ti.Filesystem.openStream(Ti.Filesystem.MODE_WRITE, Ti.Filesystem.applicationDataDirectory, "stream_test_truncate.txt");
		should(outFileStream).be.an.Object;
		outFileStream.close();
		var inFileStream = Ti.Filesystem.openStream(Ti.Filesystem.MODE_READ, Ti.Filesystem.applicationDataDirectory, "stream_test_truncate.txt");
		should(inFileStream).be.an.Object;
		var truncateBuffer = Ti.Stream.readAll(inFileStream);
		should(truncateBuffer.length).be.equal(0);
		inFileStream.close();
		finish();
	});
	it("fileMove", function(finish) {
		var f = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, "txtFiles/text.txt");
		var contents = f.read();
		var newDir = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, "movedir");
		if (!newDir.exists()) newDir.createDirectory();
		should(newDir.exists()).be.true;
		var newFile = Titanium.Filesystem.getFile(newDir.nativePath, "newfile.txt");
		newFile.write(f.read());
		should(newFile.exists()).be.true;
		// remove destination file if it exists otherwise the test will fail on multiple runs
		var destinationFile = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory + "/moved.txt");
		if (destinationFile.exists()) destinationFile.deleteFile();
		should(newFile.move(Titanium.Filesystem.applicationDataDirectory + "/moved.txt")).be.true;
		finish();
	});
	it("tempDirTest", function(finish) {
		var filename = "drillbit_temp_file.txt";
		should(Ti.Filesystem.getTempDirectory).be.a.Function;
		var outBuffer = Ti.createBuffer({
			value: "huray for data, lets have a party for data1 huray for data, lets have a party for data2 huray for data, lets have a party for data3"
		});
		should(outBuffer).be.an.Object;
		var tempFileOutStream = Ti.Filesystem.openStream(Ti.Filesystem.MODE_WRITE, Ti.Filesystem.tempDirectory, filename);
		tempFileOutStream.write(outBuffer);
		//write inBuffer to outfile
		tempFileOutStream.close();
		var inBuffer = Ti.createBuffer({
			length: 200
		});
		// have to set length on read buffer or no data will be read
		var tempFileInStream = Ti.Filesystem.openStream(Ti.Filesystem.MODE_READ, Ti.Filesystem.tempDirectory, filename);
		bytesRead = tempFileInStream.read(inBuffer);
		//read 200 byes of data from outfile into outBuffer
		tempFileInStream.close();
		for (var i = 0; bytesRead > i; i++) should(inBuffer[i]).be.equal(outBuffer[i]);
		finish();
	});
	it("emptyFile", function(finish) {
		var emptyFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, "txtFiles/empty.txt");
		should(emptyFile).not.be.null;
		should(emptyFile.size).eql(0);
		var blob = emptyFile.read();
		should(blob.length).eql(0);
		should(blob.text).eql("");
		should(blob.toString()).eql("");
		finish();
	});
	it("fileSize", function(finish) {
		// For now, all we can do is make sure the size is not 0
		// without dumping a file of an exact size
		// NOTE: Android might be failing this right now; I only
		// found a getSize() op in their code.
		var testFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, "txtFiles/file.txt");
		should(testFile).not.be.null;
		should(testFile.size).not.be.eql(0);
		var blob = testFile.read();
		should(blob.length).not.be.eql(0);
		finish();
	});
	it("mimeType", function(finish) {
		// Android currently fails this http://jira.appcelerator.org/browse/TIMOB-7394
		// removing for the time being as this is not a regression against 1.8.0.1
		// fallout work from the Filesystem parity effort will resolve this difference
		// with udpated tests
		if ("android" != Ti.Platform.osname) {
			var files = [ "test.css", "test.xml", "test.txt", "test.js", "test.htm", "test.html", "test.svg", "test.svgz", "test.png", "test.jpg", "test.jpeg", "test.gif", "test.wav", "test.mp4", "test.mov", "test.mpeg", "test.m4v" ];
			//Use common suffix when more than 1 mimeType is associated with an extension.
			//Otherwise use full mimeType for comparison
			var extensions = [ "css", "xml", "text/plain", "javascript", "text/html", "text/html", "image/svg+xml", "image/svg+xml", "image/png", "image/jpeg", "image/jpeg", "image/gif", "wav", "mp4", "video/quicktime", "mpeg", "video/x-m4v" ];
			var i = 0;
			for (i = 0; i < files.length; i++) {
				var filename = files[i];
				var testExt = extensions[i];
				var file1 = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, filename);
				if (false == file1.exists()) file1.createFile();
				should(file1).not.be.null;
				var blob1 = file1.read();
				should(blob1).not.be.null;
				var mimeType = blob1.mimeType;
				var result = mimeType.length >= testExt.length && mimeType.substr(mimeType.length - testExt.length) == testExt;
				Ti.API.info(filename + " " + mimeType + " " + testExt);
				should(result).be.true;
			}
		}
		finish();
	});
	it("filesInApplicationCacheDirectoryExists", function(finish) {
		if ("android" === Ti.Platform.osname) {
			var newDirectory = Ti.Filesystem.getFile(Ti.Filesystem.applicationCacheDirectory, "newDir");
			newDirectory.createDirectory();
			var newFile = Ti.Filesystem.getFile(newDirectory.getNativePath(), "this-file-exists.js");
			newFile.write("testing a file");
			var appDataFileDoesNotExist = Ti.Filesystem.getFile(newDirectory.getNativePath(), "this-file-does-not-exist.js");
			should(newDirectory.isDirectory()).be.true;
			should(newDirectory.exists()).be.true;
			should(newFile.exists()).be.true;
			should(appDataFileDoesNotExist.exists()).be.false;
		}
		finish();
	});
	//TIMOB-4469
	it("existsMethod", function(finish) {
		should(Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, "app.js").exists()).be.true;
		should(Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, "appp.js").exists()).be.false;
		finish();
	});
	//TIMOB-5239
	it("soundIsNotFound", function(finish) {
		if ("android" === Ti.Platform.osname) {
			var activity = Ti.Android.currentActivity;
			var intent = Ti.Android.createIntent({});
			var pending = Ti.Android.createPendingIntent({
				activity: activity,
				intent: intent,
				type: Ti.Android.PENDING_INTENT_FOR_ACTIVITY,
				flags: 1073741824
			});
			var ts = new Date().getTime();
			var notification = Ti.Android.createNotification({
				contentIntent: pending,
				contentTitle: "Test",
				contentText: "test",
				when: ts,
				sound: Titanium.Filesystem.resRawDirectory + "1.mp3",
				defaults: Titanium.Android.NotificationManager.DEFAULT_ALL
			});
			should(function() {
				Ti.Android.NotificationManager.notify(1, notification);
			}).not.throw();
		}
		finish();
	});
	//TIMOB-6932
	it.skip("File_Writable", function(finish) {
		file = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, "app.js");
		should(file.writable).be.true;
		finish();
	});
	//TIMOB-7605
	it.skip("httpClientFileTransfers", function(finish) {
				this.timeout(3e4);
		var count = 0;
		for (var i = 1; 5 >= i; i++) {
			var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, "projects", "p" + i);
			if (!file.exists()) file.createDirectory(true);
		}
		downloadafile("p1", "g.jpg", "http://www.gonzoville.com/wp-content/uploads/2011/12/0.jpeg");
		downloadafile("p2", "g.jpg", "http://www.gonzoville.com/wp-content/uploads/2011/12/0.jpeg");
		downloadafile("p3", "g.jpg", "http://www.gonzoville.com/wp-content/uploads/2011/12/0.jpeg");
		downloadafile("p4", "g.jpg", "http://www.gonzoville.com/wp-content/uploads/2011/12/0.jpeg");
		downloadafile("p5", "g.jpg", "http://www.gonzoville.com/wp-content/uploads/2011/12/0.jpeg");
		function downloadafile(foldername, filename, fileurl) {
			var file = Ti.Filesystem.pathFromComponents(Ti.Filesystem.applicationDataDirectory, "projects", foldername, filename);
			var c = Titanium.Network.createHTTPClient({
				timeout: 1e4,
				onload: function(e) {
					count++;
					if (5 == count) finish();
				},
				onerror: function(e) {
					Ti.API.info("XHR Error " + e.error);
				}
			});
			c.clearCookies("all");
			c.open("GET", fileurl);
			c.file = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory + "/projects/" + foldername + "/" + filename);
			c.send();
		}
	});
	//TIMOB-8684
	it("applicationCacheDirectory", function(finish) {
		should(Ti.Filesystem.applicationCacheDirectory).not.be.type("undefined");
		should(function() {
			Ti.API.info(Ti.Filesystem.applicationCacheDirectory);
		}).not.throw();
		finish();
	});
	//TIMOB-10107
	it("multiLingualFilename", function(finish) {
		should(function() {
			var msg = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, "網上廣東話輸入法.txt");
			msg.write("Appcelerator", true);
		}).not.throw();
		finish();
	});
	//TIMOB-12414
	it("isFileMethod", function(finish) {
		var file = Titanium.Filesystem.getFile("app.js");
		should(file.isFile()).be.true;
		finish();
	});
	//TIMOB-12901
	it("resourceDirAsFile", function(finish) {
		var resourceDir = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory);
		should(resourceDir.isDirectory()).be.true;
		should(resourceDir.isFile()).be.false;
		finish();
	});
	//TIMOB-14364
	it("setRemoteBackup", function(finish) {
		if ("iphone" === Ti.Platform.osname || "ipad" === Ti.Platform.osname) {
			should(function() {
				Titanium.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory).setRemoteBackup(false);
			}).not.throw();
			finish();
		} else finish();
	});
	//TIMOB-19833
	it("getAsset", function(finish) {
		if ("iphone" === Ti.Platform.osname || "ipad" === Ti.Platform.osname) {
			//only available with <use-app-thinning>true</use-app-thinning>
			var imageBlob = Ti.Filesystem.getAsset('images/foo.png');
			should(imageBlob).not.be.null;
		}
		finish();
	});	
});