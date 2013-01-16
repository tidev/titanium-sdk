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

	this.name = "filesystem";
	this.tests = [
		{name: "optionalArgAPIs"},
		{name: "readWriteText"},
		{name: "blobNativeFile"},
		{name: "blobFile"},
		{name: "dotSlash"},
		{name: "appendStringTest"},
		{name: "appendBlobTest"},
		{name: "appendFileTest"},
		{name: "fileStreamBasicTest"},
		{name: "fileStreamWriteTest"},
		{name: "fileStreamAppendTest"},
		{name: "fileStreamPumpTest"},
		{name: "fileStreamWriteStreamTest"},
		{name: "fileStreamResourceFileTest"},
		{name: "fileStreamTruncateTest"},
		{name: "fileMove"},
		{name: "tempDirTest"},
		{name: "emptyFile"},
		{name: "fileSize"},
		{name: "mimeType"},
		{name: "filesInApplicationCacheDirectoryExists"}
	]

	this.optionalArgAPIs = function(testRun) {
		// https://appcelerator.lighthouseapp.com/projects/32238/tickets/2211-android-filesystem-test-generates-runtime-error
		var newDir = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'mydir');
		newDir.createDirectory();
		valueOf(testRun, newDir.exists()).shouldBeTrue();
		newDir.deleteDirectory();
		valueOf(testRun, newDir.exists()).shouldBeFalse();

		finish(testRun);
	}

	this.readWriteText = function(testRun) {
		var TEXT = "This is my text";
		var FILENAME = 'test.txt';
		var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, FILENAME);
		if (file.exists()) {
			file.deleteFile();
		}
		//TODO: What is the writability of a file that does not exist? The spec is silent on this.
		//Arguments can be made either way (True, we can write, false, no file exists)
		file.write(TEXT);
		valueOf(testRun, file.writable).shouldBeTrue();
		// nullify and re-create to test
		file = null;
		file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, FILENAME);
		valueOf(testRun, file.exists()).shouldBeTrue();
		var blob = file.read();
		valueOf(testRun, blob).shouldNotBeNull();
		var readText = blob.text;
		valueOf(testRun, readText).shouldNotBeNull();
		valueOf(testRun, readText).shouldNotBeUndefined();
		valueOf(testRun, readText).shouldBeString();
		valueOf(testRun, readText.length).shouldBe(TEXT.length);
		valueOf(testRun, readText).shouldBe(TEXT);
		file.deleteFile();

		finish(testRun);
	}

	this.blobNativeFile = function(testRun) {
		var filename = 'blobtest';
		var testphrase = 'Revenge of the Blob';
		var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, filename);

		if (file.exists()) {
			file.deleteFile();
		}
		file.write(testphrase);
		var blob = file.read();
		file = null;
		var path = blob.nativePath;
		file = Ti.Filesystem.getFile(path);
		valueOf(testRun, file.exists()).shouldBeTrue();
		var readphrase = file.read().text;
		valueOf(testRun, readphrase).shouldBe(testphrase);

		finish(testRun);
	}

	this.blobFile = function(testRun) {
		var filename = 'blobtest';
		var testphrase = 'Revenge of the Blob';
		var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, filename);

		if (file.exists()) {
			file.deleteFile();
		}
		file.write(testphrase);
		var blob = file.read();
		var blobFile = blob.file;
		valueOf(testRun, blobFile.nativePath).shouldBe(file.nativePath);
		valueOf(testRun, blobFile.exists()).shouldBeTrue();
		var readphrase = blobFile.read().text;
		valueOf(testRun, readphrase).shouldBe(testphrase);
		file = null;

		finish(testRun);
	}

	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2443-android-paths-beginning-with-are-not-recognised#ticket-2443-6
	this.dotSlash = function(testRun) {
		var f;
		var blob;
		valueOf(testRun, function(){f = Ti.Filesystem.getFile('./file.txt');}).shouldNotThrowException();
		//Resource files are readonly, but only on device, not simulator. As such, we can't test
		//the use case of where writable should be false.
		valueOf(testRun, function(){blob = f.read();}).shouldNotThrowException();
		var text;
		valueOf(testRun, function(){text = blob.text;}).shouldNotThrowException();
		valueOf(testRun, text.length).shouldBeGreaterThan(0);

		finish(testRun);
	}

	this.appendStringTest = function(testRun) {
		var f = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'data.txt');
		valueOf(testRun, f).shouldNotBeNull();

		var appended_text = 'Some appended text';
		var previous_text = "";
		
		// Check if the file exists before trying to read from it!

		if(f.exists()) {
			var prev_blob;

			valueOf(testRun, function() {
				prev_blob = f.read();
				previous_text = prev_blob.text;
			}).shouldNotThrowException();
		}

		f.write(appended_text, true);
		
		var final_blob = f.read();
		valueOf(testRun, final_blob).shouldNotBeNull();
		valueOf(testRun, final_blob.text).shouldBe(previous_text + appended_text);

		finish(testRun);
	}

	this.appendBlobTest = function(testRun) {
		var blob = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'suites/filesystem/file.txt').read();
		var dest = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'append_blob.txt');
		
		valueOf(testRun, blob).shouldNotBeNull();
		valueOf(testRun, dest).shouldNotBeNull();
		
		var previous = "";
		
		if(dest.exists()) {
			var dest_blob = dest.read();
			valueOf(testRun, dest_blob).shouldNotBeNull();
			previous = dest_blob.text;
		}
		
		dest.write(blob, true);
		
		var final_blob = dest.read();
		valueOf(testRun, final_blob).shouldNotBeNull();
		valueOf(testRun, final_blob.text).shouldBe(previous + blob.text);

		finish(testRun);
	}

	this.appendFileTest = function(testRun) {
		var source = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'suites/filesystem/file.txt');
		var dest 	 = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'append_file.txt');
		var previous = "";

		valueOf(testRun, source).shouldNotBeNull();
		valueOf(testRun, dest).shouldNotBeNull();
		
		if(dest.exists()) {
			previous = dest.read().text;
		}
		
		dest.write(source, true);
		
		var source_blob = source.read();
		valueOf(testRun, source_blob).shouldNotBeNull();
		
		var dest_blob = dest.read();
		valueOf(testRun, dest_blob).shouldNotBeNull();
		
		valueOf(testRun, dest_blob.text).shouldBe(previous + source_blob.text);

		finish(testRun);
	}

	this.fileStreamBasicTest = function(testRun) {
		valueOf(testRun, Ti.createBuffer).shouldBeFunction();
		valueOf(testRun, Ti.Filesystem.openStream).shouldBeFunction();

		var resourceFileStream = Ti.Filesystem.openStream(Ti.Filesystem.MODE_READ, Ti.Filesystem.resourcesDirectory, 'suites/filesystem/stream_test_in.txt');
		valueOf(testRun, resourceFileStream).shouldBeObject();
		valueOf(testRun, resourceFileStream.read).shouldBeFunction();
		valueOf(testRun, resourceFileStream.write).shouldBeFunction();

		var inBuffer = Ti.createBuffer();
		valueOf(testRun, inBuffer).shouldBeObject();

		var tempBufferLength = 50;
		var tempBuffer = Ti.createBuffer({length:tempBufferLength});
		valueOf(testRun, tempBuffer).shouldBeObject();
		valueOf(testRun, tempBuffer.length).shouldBe(tempBufferLength);

		var bytesRead = resourceFileStream.read(tempBuffer);
		while(bytesRead > -1) {
			Ti.API.info('bytes read ' + bytesRead);

	 	   	// buffer is expanded to contain the new data and the length is updated to reflect this
			var previousData = inBuffer.toString();
			inBuffer.append(tempBuffer);

			// assert that the append worked correctly
			valueOf(testRun, previousData + tempBuffer.toString()).shouldBe(inBuffer.toString());
				
			// clear the buffer rather than creating a new temp one
			tempBuffer.clear();
			bytesRead = resourceFileStream.read(tempBuffer);
		}
		resourceFileStream.close();

		// assert that we can read/write successfully from the out file.
		var appDataFileOutStream = Ti.Filesystem.openStream(Ti.Filesystem.MODE_WRITE, Ti.Filesystem.applicationDataDirectory, 'stream_test_out.txt');
		appDataFileOutStream.write(inBuffer); //write inBuffer to outfile
		appDataFileOutStream.close();

		var outBuffer = Ti.createBuffer({length:50}); // have to set length on read buffer or no data will be read
		var appDataFileInStream = Ti.Filesystem.openStream(Ti.Filesystem.MODE_READ, Ti.Filesystem.applicationDataDirectory, 'stream_test_out.txt');
		bytesRead = appDataFileInStream.read(outBuffer); //read 50 byes of data from outfile into outBuffer
		appDataFileInStream.close();

		for (var i=0; i < bytesRead; i++) {
			valueOf(testRun, inBuffer[i]).shouldBeExactly(outBuffer[i]);
		}

		finish(testRun);
	}

	this.fileStreamWriteTest = function(testRun) {
		var infile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'suites/filesystem/stream_test_in.txt');
		var instream = infile.open(Ti.Filesystem.MODE_READ);
		var outfile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'fswritetest.jpg');
		var outstream = outfile.open(Ti.Filesystem.MODE_WRITE);

		var buffer = Ti.createBuffer({length: 20});
		var totalWriteSize = 0;
		var size = 0;
		while ((size = instream.read(buffer)) > -1) {
			outstream.write(buffer, 0, size);
			totalWriteSize += size;
		}
		instream.close();
		outstream.close();

		infile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'fswritetest.jpg');
		instream = infile.open(Ti.Filesystem.MODE_READ);
		var inBuffer = Ti.Stream.readAll(instream);
		var totalReadSize = inBuffer.length;
		valueOf(testRun, totalReadSize).shouldBeExactly(totalWriteSize);
		instream.close();

		finish(testRun);
	}

	this.fileStreamAppendTest = function(testRun) {
		var infile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'suites/filesystem/stream_test_in.txt');
		var instream = infile.open(Ti.Filesystem.MODE_READ);
		var outfile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'fsappendtest.jpg');
		if(outfile.exists()) {
			outfile.deleteFile();
		}
		var outstream = outfile.open(Ti.Filesystem.MODE_WRITE);

		var bytesStreamed = Ti.Stream.writeStream(instream, outstream, 40);
		instream.close();
		outstream.close();

		infile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'suites/filesystem/stream_test_in.txt');
		instream = infile.open(Ti.Filesystem.MODE_READ);
		var appendfile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'fsappendtest.jpg');
		var appendstream = appendfile.open(Ti.Filesystem.MODE_APPEND);

		var buffer = Ti.createBuffer({length: 20});
		var totalWriteSize = 0;
		var size = 0;
		while ((size = instream.read(buffer)) > -1) {
			appendstream.write(buffer, 0, size);
			totalWriteSize += size;
		}
		instream.close();
		appendstream.close();

		infile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'fsappendtest.jpg');
		instream = infile.open(Ti.Filesystem.MODE_READ);
		var inBuffer = Ti.Stream.readAll(instream);
		var totalReadSize = inBuffer.length;
		Ti.API.info('Total read size: '+totalReadSize);
		Ti.API.info('Streamed: '+bytesStreamed);
		Ti.API.info('Total write size: '+totalWriteSize);
		valueOf(testRun, totalReadSize).shouldBeExactly(bytesStreamed + totalWriteSize);
		instream.close();

		finish(testRun);
	}

	this.fileStreamPumpTest = function(testRun) {
		var pumpInputFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'suites/filesystem/stream_test_in.txt');
		valueOf(testRun, pumpInputFile).shouldBeObject();
		valueOf(testRun, pumpInputFile.open).shouldBeFunction();
		valueOf(testRun, pumpInputFile.exists()).shouldBeTrue();

		var step = 10;
		var pumpTotal = 0;
		var pumpCallback = function(e) {
			if(e.bytesProcessed == -1) {
				//EOF
				Ti.API.info('Reached EOF in pumpCallback');
				return;
			}
			Ti.API.info('Received data chunk of size <' + e.bytesProcessed + '>');
			Ti.API.info('Received buffer <' + e.buffer + '>');
			Ti.API.info('Total bytes received thus far <' + e.totalBytesProcessed + '>');

			valueOf(testRun, e.bytesProcessed).shouldBe(step);
			valueOf(testRun, e.totalBytesProcessed).shouldBe(step + pumpTotal);

			pumpTotal += e.bytesProcessed;
		};

		var pumpStream = pumpInputFile.open(Ti.Filesystem.MODE_READ);
		valueOf(testRun, pumpStream).shouldBeObject();

		Ti.Stream.pump(pumpStream, pumpCallback, step);
		pumpStream.close();

		finish(testRun);
	}

	this.fileStreamWriteStreamTest = function(testRun) {
		var inBuffer = Ti.createBuffer({value:"huray for data, lets have a party for data1 huray for data, lets have a party for data2 huray for data, lets have a party for data3"});
		valueOf(testRun, inBuffer).shouldBeObject();
		var inStream = Ti.Stream.createStream({source:inBuffer, mode:Ti.Stream.MODE_READ});
		valueOf(testRun, inStream).shouldNotBeNull();

		var outFileStream = Ti.Filesystem.openStream(Ti.Filesystem.MODE_WRITE, Ti.Filesystem.applicationDataDirectory, 'stream_test_out.txt');
		valueOf(testRun, outFileStream).shouldBeObject();

		// writes all data from inBufferStream to outFileStream in chunks of 30
		var bytesWritten = Ti.Stream.writeStream(inStream, outFileStream, 30);
		Ti.API.info('<' + bytesWritten + '> bytes written, closing both streams');

		// assert that the length of the outBuffer is equal to the amount of bytes that were written
		valueOf(testRun, bytesWritten).shouldBe(inBuffer.length);

		outFileStream.close();

		finish(testRun);
	}

	this.fileStreamResourceFileTest = function(testRun) {
		if(Ti.Platform.osname === 'android') {
			valueOf(testRun, function() {Ti.Filesystem.openStream(Ti.Filesystem.MODE_WRITE, Ti.Filesystem.resourcesDirectory, 'suites/filesystem/stream_test_in.txt')}).shouldThrowException();
			valueOf(testRun, function() {Ti.Filesystem.openStream(Ti.Filesystem.MODE_APPEND, Ti.Filesystem.resourcesDirectory, 'suites/filesystem/stream_test_in.txt')}).shouldThrowException();

			valueOf(testRun, function() {
				var resourceFileStream = Ti.Filesystem.openStream(Ti.Filesystem.MODE_READ, Ti.Filesystem.resourcesDirectory, 'suites/filesystem/stream_test_in.txt');
				resourceFileStream.close()
			}).shouldNotThrowException();
		}

		finish(testRun);
	}

	this.fileStreamTruncateTest = function(testRun) {
		var inBuffer = Ti.createBuffer({value:"huray for data, lets have a party for data1 huray for data, lets have a party for data2 huray for data, lets have a party for data3"});
		valueOf(testRun, inBuffer).shouldBeObject();
		var inStream = Ti.Stream.createStream({source:inBuffer, mode:Ti.Stream.MODE_READ});
		valueOf(testRun, inStream).shouldNotBeNull();

		var outFileStream = Ti.Filesystem.openStream(Ti.Filesystem.MODE_WRITE, Ti.Filesystem.applicationDataDirectory, 'stream_test_truncate.txt');
		valueOf(testRun, outFileStream).shouldBeObject();

		// writes all data from inBufferStream to outFileStream in chunks of 30
		var bytesWritten = Ti.Stream.writeStream(inStream, outFileStream, 30);
		Ti.API.info('<' + bytesWritten + '> bytes written, closing both streams');

		// assert that the length of the outBuffer is equal to the amount of bytes that were written
		valueOf(testRun, bytesWritten).shouldBe(inBuffer.length);
		outFileStream.close();

		var outFileStream = Ti.Filesystem.openStream(Ti.Filesystem.MODE_WRITE, Ti.Filesystem.applicationDataDirectory, 'stream_test_truncate.txt');
		valueOf(testRun, outFileStream).shouldBeObject();
		outFileStream.close();

		var inFileStream = Ti.Filesystem.openStream(Ti.Filesystem.MODE_READ, Ti.Filesystem.applicationDataDirectory, 'stream_test_truncate.txt');
		valueOf(testRun, inFileStream).shouldBeObject();

		var truncateBuffer = Ti.Stream.readAll(inFileStream);
		valueOf(testRun, truncateBuffer.length).shouldBeExactly(0);

		inFileStream.close();

		finish(testRun);
	}

	this.fileMove = function(testRun) {
		var f = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, 'suites/filesystem/text.txt');
		var contents = f.read();

		var newDir = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory,'movedir');
		if(!newDir.exists()) {
			newDir.createDirectory();
		}
		valueOf(testRun, newDir.exists()).shouldBeTrue();

		var newFile = Titanium.Filesystem.getFile(newDir.nativePath,'newfile.txt');
		newFile.write(f.read());
		valueOf(testRun, newFile.exists()).shouldBeTrue();

		// remove destination file if it exists otherwise the test will fail on multiple runs
		var destinationFile = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory+'/moved.txt');
		if(destinationFile.exists()) {
			destinationFile.deleteFile();
		}

		valueOf(testRun, newFile.move(Titanium.Filesystem.applicationDataDirectory+'/moved.txt')).shouldBeTrue();

		finish(testRun);
	}

	this.tempDirTest = function(testRun) {
		var filename = "drillbit_temp_file.txt";
		valueOf(testRun, Ti.Filesystem.getTempDirectory).shouldBeFunction();

		var outBuffer = Ti.createBuffer({value:"huray for data, lets have a party for data1 huray for data, lets have a party for data2 huray for data, lets have a party for data3"});
		valueOf(testRun, outBuffer).shouldBeObject();

		var tempFileOutStream = Ti.Filesystem.openStream(Ti.Filesystem.MODE_WRITE, Ti.Filesystem.tempDirectory, filename);
		tempFileOutStream.write(outBuffer); //write inBuffer to outfile
		tempFileOutStream.close();

		var inBuffer = Ti.createBuffer({length:200}); // have to set length on read buffer or no data will be read
		var tempFileInStream = Ti.Filesystem.openStream(Ti.Filesystem.MODE_READ, Ti.Filesystem.tempDirectory, filename);
		bytesRead = tempFileInStream.read(inBuffer); //read 200 byes of data from outfile into outBuffer
		tempFileInStream.close();

		for (var i=0; i < bytesRead; i++) {
			valueOf(testRun, inBuffer[i]).shouldBeExactly(outBuffer[i]);
		}

		finish(testRun);
	}

	this.emptyFile = function(testRun) {
		var emptyFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, "suites/filesystem/empty.txt");
		valueOf(testRun, emptyFile).shouldNotBeNull();
		valueOf(testRun, emptyFile.size).shouldBe(0);

		var blob = emptyFile.read();
		valueOf(testRun, blob.length).shouldBe(0);
		valueOf(testRun, blob.text).shouldBe("");
		valueOf(testRun, blob.toString()).shouldBe("");

		finish(testRun);
	}

	this.fileSize = function(testRun) {
		// For now, all we can do is make sure the size is not 0
		// without dumping a file of an exact size
		
		// NOTE: Android might be failing this right now; I only
		// found a getSize() op in their code.
		
		var testFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, "suites/filesystem/file.txt");
		valueOf(testRun, testFile).shouldNotBeNull();
		valueOf(testRun, testFile.size).shouldNotBe(0);

		var blob = testFile.read();
		valueOf(testRun, blob.length).shouldNotBe(0);

		finish(testRun);
	}

	this.mimeType = function(testRun) {
		// Android currently fails this http://jira.appcelerator.org/browse/TIMOB-7394
		// removing for the time being as this is not a regression against 1.8.0.1
		// fallout work from the Filesystem parity effort will resolve this difference
		// with udpated tests

		if (Ti.Platform.osname != 'android') {
			var files = ['test.css','test.xml','test.txt','test.js','test.htm','test.html','test.svg','test.svgz','test.png','test.jpg','test.jpeg','test.gif','test.wav','test.mp4','test.mov','test.mpeg','test.m4v'];
	
			//Use common suffix when more than 1 mimeType is associated with an extension.
			//Otherwise use full mimeType for comparison
			var extensions = ['css','xml','text/plain','javascript','text/html','text/html','image/svg+xml','image/svg+xml','image/png','image/jpeg','image/jpeg','image/gif','wav','mp4','video/quicktime','mpeg','video/x-m4v'];
	
			var i=0;

			for (i=0;i<files.length;i++)
			{
				var filename = files[i];
				var testExt = extensions[i];
				var file1 = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory,filename);
				if(file1.exists() == false)
				{
					file1.createFile();
				}
				valueOf(testRun, file1).shouldNotBeNull();

				var blob1 = file1.read();
				valueOf(testRun, blob1).shouldNotBeNull();
				var mimeType = blob1.mimeType;
			
				var result = ( (mimeType.length >= testExt.length) && (mimeType.substr(mimeType.length - testExt.length) == testExt) );
			
				Ti.API.info(filename+" "+mimeType+" "+testExt);
				valueOf(testRun, result).shouldBeTrue();
			}
		}

		finish(testRun);
	}

	this.filesInApplicationCacheDirectoryExists = function(testRun) {
		if(Ti.Platform.osname === 'android') {
			var newDirectory = Ti.Filesystem.getFile(Ti.Filesystem.applicationCacheDirectory, 'newDir');
			newDirectory.createDirectory();
		
			var newFile = Ti.Filesystem.getFile(newDirectory.getNativePath(), 'this-file-exists.js');
			newFile.write("testing a file");
		
			var appDataFileDoesNotExist = Ti.Filesystem.getFile(newDirectory.getNativePath(), 'this-file-does-not-exist.js');
		
			valueOf(testRun, newDirectory.isDirectory()).shouldBeTrue();
			valueOf(testRun, newDirectory.exists()).shouldBeTrue();
			valueOf(testRun, newFile.exists()).shouldBeTrue();
			valueOf(testRun, appDataFileDoesNotExist.exists()).shouldBeFalse();
		}

		finish(testRun);
	}
}
