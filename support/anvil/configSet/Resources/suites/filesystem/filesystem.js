/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

module.exports = new function() {
	var finish,
		valueOf,
		isTizen = Ti.Platform.osname === 'tizen',
		isMobileWeb = Ti.Platform.osname === 'mobileweb',
		isAndroid = Ti.Platform.osname === 'android';

	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "filesystem";
    this.tests = (function() {
        var arr = [
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
            {name: "filesInApplicationCacheDirectoryExists"},
            {name: "fileCopy"},
            {name: "fileProperties"},
            {name: "directoryListing"},
            {name: "tempDirAndFile"},
            {name: "fsMethodAndProp"}
        ];

        if (isTizen || isMobileWeb) {
            arr = arr.concat([
                {name: "appendString"},
                {name: "appendBlob"},
                {name: "appendFile"},
                {name: "resolveTest"}
            ]);
        }

        return arr;
    }());

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
		valueOf(testRun, function(){f = Ti.Filesystem.getFile('suites/filesystem/file.txt');}).shouldNotThrowException();
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
        var isReadable,
            isWriteable;

		valueOf(testRun, Ti.createBuffer).shouldBeFunction();
		valueOf(testRun, Ti.Filesystem.openStream).shouldBeFunction();

		var resourceFileStream = Ti.Filesystem.openStream(Ti.Filesystem.MODE_READ, Ti.Filesystem.resourcesDirectory, 'suites/filesystem/stream_test_in.txt');
		valueOf(testRun, resourceFileStream).shouldBeObject();
		valueOf(testRun, resourceFileStream.read).shouldBeFunction();
		valueOf(testRun, resourceFileStream.write).shouldBeFunction();

        valueOf(testRun, function() {
            isReadable = resourceFileStream.isReadable();
        }).shouldNotThrowException();

        valueOf(testRun, function() {
            isWriteable = resourceFileStream.isWriteable();
        }).shouldNotThrowException();

        valueOf(testRun, isReadable).shouldBeTrue();
        valueOf(testRun, isWriteable).shouldBeFalse();

		var inBuffer = Ti.createBuffer();
		valueOf(testRun, inBuffer).shouldBeObject();

		var tempBufferLength = 50;
		var tempBuffer = Ti.createBuffer({length:tempBufferLength});
		valueOf(testRun, tempBuffer).shouldBeObject();
		valueOf(testRun, tempBuffer.length).shouldBe(tempBufferLength);

		var bytesRead = resourceFileStream.read(tempBuffer);
		while (bytesRead > 0) {
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
		if (!isTizen && !isMobileWeb) {		// due to unsupported Ti.Stream
			var infile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'suites/filesystem/stream_test_in.txt'),
				instream = infile.open(Ti.Filesystem.MODE_READ),
				outfile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'fswritetest.jpg'),
				outstream = outfile.open(Ti.Filesystem.MODE_WRITE),
				buffer = Ti.createBuffer({length: 20}),
				totalWriteSize = 0,
				size = 0;

			while ((size = instream.read(buffer)) > 0) {
				outstream.write(buffer, 0, size);
				totalWriteSize += size;
			}

			instream.close();
			outstream.close();
		
		
			infile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'fswritetest.jpg');
			instream = infile.open(Ti.Filesystem.MODE_READ);

			var inBuffer = Ti.Stream.readAll(instream),
				totalReadSize = inBuffer.length;

			valueOf(testRun, totalReadSize).shouldBeExactly(totalWriteSize);
			instream.close();
		}
		finish(testRun);
	}

	this.fileStreamAppendTest = function(testRun) {
		if(!isTizen && !isMobileWeb) { 		// due to unsupported Ti.Stream
			var infile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'suites/filesystem/stream_test_in.txt'),
				instream = infile.open(Ti.Filesystem.MODE_READ),
				outfile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'fsappendtest.jpg');
			
			if (outfile.exists()) {
				outfile.deleteFile();
			}

			var outstream = outfile.open(Ti.Filesystem.MODE_WRITE),
				bytesStreamed = Ti.Stream.writeStream(instream, outstream, 40);

			instream.close();
			outstream.close();

			infile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'suites/filesystem/stream_test_in.txt');
			instream = infile.open(Ti.Filesystem.MODE_READ);

			var appendfile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'fsappendtest.jpg'),
				appendstream = appendfile.open(Ti.Filesystem.MODE_APPEND);

			var buffer = Ti.createBuffer({length: 20}),
				totalWriteSize = 0,
				size = 0;

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
		}
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

		// Ti.Stream not suppotred on mobileweb and Tizen
		if (!isTizen && !isMobileWeb) {
			var pumpStream = pumpInputFile.open(Ti.Filesystem.MODE_READ);
			valueOf(testRun, pumpStream).shouldBeObject();

			Ti.Stream.pump(pumpStream, pumpCallback, step);
			pumpStream.close();
		}
		finish(testRun);
	}

	this.fileStreamWriteStreamTest = function(testRun) {
		if (!isTizen && !isMobileWeb) { // due to unsupported Ti.Stream
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
		}
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
		if (!isTizen && !isMobileWeb) {     // due to unsupported Ti.Stream
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
		}
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
		newFile.write(contents);
		valueOf(testRun, newFile.exists()).shouldBeTrue();

		// remove destination file if it exists otherwise the test will fail on multiple runs
		var destinationFile = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory+'/moved.txt');
		if(destinationFile.exists()) {
			destinationFile.deleteFile();
		}

		valueOf(testRun, newFile.move(Titanium.Filesystem.applicationDataDirectory+'/moved.txt')).shouldBeTrue();

        newFile = Titanium.Filesystem.getFile(newDir.nativePath, 'newfile.txt');
        valueOf(testRun, newFile.exists()).shouldBeFalse();

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

		var inBuffer = Ti.createBuffer({length:200}), // have to set length on read buffer or no data will be read
			tempFileInStream = Ti.Filesystem.openStream(Ti.Filesystem.MODE_READ, Ti.Filesystem.tempDirectory, filename),
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

    this.fileCopy = function(testRun) {
        // Try to create file and folder
        // Copy this file to this directory 
        // Verify if file is present in both places

        var f = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, 'suites/filesystem/text.txt'),
            contents = f.read(),
            isFile,
            copiedFile,
			newDir = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory,'copydir');

        if (!newDir.exists()) {
            newDir.createDirectory();
        }

        valueOf(testRun, function() {
            isFile = newDir.isFile();
        }).shouldNotThrowException();

        valueOf(testRun, isFile).shouldBeFalse();
        valueOf(testRun, newDir.exists()).shouldBeTrue();

        var newFile = Titanium.Filesystem.getFile(newDir.nativePath, 'newfile.txt');
        newFile.write(contents);
        valueOf(testRun, newFile.exists()).shouldBeTrue();

        // remove destination file if it exists, otherwise the test will fail on multiple runs
        var destinationFile = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory+'/copied.txt');
        if(destinationFile.exists()) {
            destinationFile.deleteFile();
        }

        if (isTizen || isMobileWeb || isAndroid) {
            valueOf(testRun, newFile.copy(Titanium.Filesystem.applicationDataDirectory+'/copied.txt')).shouldBeTrue();
            copiedFile  = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory+'/copied.txt');
            valueOf(testRun, copiedFile.exists()).shouldBeTrue();
        } 

        newFile = Titanium.Filesystem.getFile(newDir.nativePath, 'newfile.txt');

        valueOf(testRun, function() {
            isFile = newFile.isFile();
        }).shouldNotThrowException();

        valueOf(testRun, isFile).shouldBeTrue();
        valueOf(testRun, newFile.exists()).shouldBeTrue();

        finish(testRun);
    }


    this.fileProperties = function(testRun) {
        // Try to create not empty file
        // Check the properties and methods for this file

        var f = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, 'suites/filesystem/text.txt'),
            contents = f.read(),
            hid,
            name,
            timeNow,
            ext,
            fileParent,
            readOnly,
            fileExecutable,
            fileSymbolicLink,
            fileTimestamp,
            fileModificationTimestamp,
            newFile = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory,'newFile.txt');

        newFile.write(contents, false);
        valueOf(testRun, newFile.exists()).shouldBeTrue();

        valueOf(testRun, newFile.hidden).shouldBeFalse();

        valueOf(testRun, function() {
            hid = newFile.getHidden();
        }).shouldNotThrowException();

        valueOf(testRun, hid).shouldBeFalse();

        valueOf(testRun, function() {
            newFile.setHidden(true);
        }).shouldNotThrowException();

        valueOf(testRun, newFile.hidden).shouldBeTrue();

        valueOf(testRun, function() {
            hid = newFile.getHidden();
        }).shouldNotThrowException();

        valueOf(testRun, hid).shouldBeTrue();
        
        // Name of File Test
        valueOf(testRun, function() {
            name = newFile.getName();
        }).shouldNotThrowException();

        valueOf(testRun, name).shouldBeEqual('newFile.txt');
        valueOf(testRun, newFile.name).shouldBeEqual('newFile.txt');

        valueOf(testRun, newFile.rename('supernewfile.txt')).shouldBeTrue();

        newFile = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, 'supernewfile.txt');
        newFile = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, 'newfile.txt');

        valueOf(testRun, newFile.exists()).shouldBeFalse();

        newFile = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, 'supernewfile.txt');

        valueOf(testRun, newFile.exists()).shouldBeTrue();
        
        // Parent of a file Test
        valueOf(testRun, function() {
			fileParent = newFile.getParent();
        }).shouldNotThrowException();

        valueOf(testRun, newFile.parent).shouldBeObject();
        valueOf(testRun, fileParent).shouldBeObject();

        // Readonly Test
        valueOf(testRun, function() {
            readOnly = newFile.getReadonly();
        }).shouldNotThrowException();

        valueOf(testRun, readOnly).shouldBeFalse();
        valueOf(testRun, newFile.readonly).shouldBeFalse(); 

        // Local files is readonly  
        valueOf(testRun, function() {
            readOnly = f.getReadonly();
        }).shouldNotThrowException();

        valueOf(testRun, readOnly).shouldBeTrue();
        valueOf(testRun, f.readonly).shouldBeTrue();

        // Executable Test
        valueOf(testRun, function() {
            fileExecutable = newFile.getExecutable();
        }).shouldNotThrowException();

        valueOf(testRun, fileExecutable).shouldBeFalse();
        valueOf(testRun, newFile.executable).shouldBeFalse(); 

        // SymbolicLink Test
        valueOf(testRun, function() {
            fileSymbolicLink = newFile.getSymbolicLink();
        }).shouldNotThrowException();

        valueOf(testRun, fileSymbolicLink).shouldBeFalse();
        valueOf(testRun, newFile.symbolicLink).shouldBeFalse(); 

        // Extension Test
        valueOf(testRun, function() {
            ext = newFile.extension();
        }).shouldNotThrowException();

        valueOf(testRun, ext).shouldBeEqual('txt');

        // Timestamp Test
        valueOf(testRun, function() {
            fileTimestamp = newFile.createTimestamp();
        }).shouldNotThrowException();

        valueOf(testRun, function() {
            fileModificationTimestamp = newFile.modificationTimestamp();
        }).shouldNotThrowException();
        
        timeNow = new Date().getTime();
        valueOf(testRun, fileTimestamp).shouldBeNumber();
        valueOf(testRun, fileModificationTimestamp).shouldBeNumber();
        valueOf(testRun, fileTimestamp - timeNow).shouldBeLessThan(1000);
        valueOf(testRun, fileModificationTimestamp - timeNow).shouldBeLessThan(1000);

        finish(testRun);
    }

    this.directoryListing = function(testRun) {
        // Try to create directory and file
        // Try to create two directories in the created directory
        // Check the getDirectoryListing() method for directory and file

        var dirList,
            fileList,
            file = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, 'someFile.txt');

        if (file.exists() == false) {
            file.createFile();
        }

        var newDir = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory,'newdir');

        if (!newDir.exists()) {
            newDir.createDirectory();
        }
        var newDir1 = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory,'newdir/newdir1');

        if (!newDir1.exists()) {
            newDir1.createDirectory();
        }

        var newDir2 = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory,'newdir/newdir2');

        if (!newDir2.exists()) {
            newDir2.createDirectory();
        }

        valueOf(testRun, function() {
            dirList = newDir.getDirectoryListing();
        }).shouldNotThrowException();

        valueOf(testRun, dirList).shouldBeArray();
        valueOf(testRun, dirList.length).shouldBeEqual(2);
        valueOf(testRun, dirList[0]).shouldBeEqual('newdir1');
        valueOf(testRun, dirList[1]).shouldBeEqual('newdir2');

        // Fails for file
        valueOf(testRun, file.getDirectoryListing()).shouldBeNull();

        finish(testRun);
    }

    this.tempDirAndFile = function(testRun) {
        // Try to create temp directory and temp file
        var tmpDir,
            tmpFile;

        valueOf(testRun, function() {
            tmpDir = Ti.Filesystem.createTempDirectory();
        }).shouldNotThrowException();

        valueOf(testRun, function() {
            tmpFile = Ti.Filesystem.createTempFile();
        }).shouldNotThrowException();        

        valueOf(testRun, tmpDir.exists()).shouldBeTrue();
        valueOf(testRun, tmpFile.exists()).shouldBeTrue();

        finish(testRun);
    }

    this.fsMethodAndProp = function(testRun){
        // Check some filesystem's methods and properties
        var sep,
            lineEnding,
            resourcesDir;

        valueOf(testRun, function() {
            sep = Ti.Filesystem.getSeparator();
        }).shouldNotThrowException();
        valueOf(testRun, Ti.Filesystem.separator).shouldBeEqual(sep);

        if (isTizen) { 
            valueOf(testRun, sep).shouldBeEqual('/');        
        }

        valueOf(testRun, function() {
            resourcesDir = Ti.Filesystem.getResourcesDirectory();
        }).shouldNotThrowException();

        valueOf(testRun, resourcesDir).shouldBeEqual(resourcesDir);

        if (isTizen) {
            valueOf(testRun, Ti.Filesystem.resourcesDirectory).shouldBeEqual('/');
        }

        valueOf(testRun, function() {
            lineEnding = Ti.Filesystem.getLineEnding();
        }).shouldNotThrowException();

        valueOf(testRun, Ti.Filesystem.lineEnding).shouldBeEqual(lineEnding);
        
        if (isTizen){
            valueOf(testRun, lineEnding).shouldBeEqual('\n');
        }

        finish(testRun);
    }

    this.appendString = function(testRun){
        // Try to append a string to a text file

        var f = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'data.txt'),
            appended_text = 'Some appended text',
            previous_text = "",
            final_blob,
            prev_blob;

        valueOf(testRun, f).shouldNotBeNull();

        // Check if the file exists before trying to read from it!
        if (f.exists()) {
            valueOf(testRun, function() {
                prev_blob = f.read();
                previous_text = prev_blob.text;
            }).shouldNotThrowException();
        }

        valueOf(testRun, function() {
            f.append(appended_text);
        }).shouldNotThrowException();

        final_blob = f.read();
        valueOf(testRun, final_blob).shouldNotBeNull();
        valueOf(testRun, final_blob.text).shouldBe(previous_text + appended_text);

        finish(testRun);
    }

    this.appendBlob = function(testRun){
        // Try to append the blob to a text file
        var blob = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'suites/filesystem/file.txt').read(),
            dest = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'append_blob.txt'),
            previous = "",
            final_blob,
            dest_blob;

        valueOf(testRun, blob).shouldNotBeNull();
        valueOf(testRun, dest).shouldNotBeNull();

        if (dest.exists()) {
            dest_blob = dest.read();
            valueOf(testRun, dest_blob).shouldNotBeNull();
            previous = dest_blob.text;
        }

        valueOf(testRun, function() {
            dest.append(blob);
        }).shouldNotThrowException();

        final_blob = dest.read();
        valueOf(testRun, final_blob).shouldNotBeNull();
        valueOf(testRun, final_blob.text).shouldBe(previous + blob.text);

        finish(testRun);
    }

    this.appendFile = function(testRun) {
        // Try to append a file to a text file
        var source = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'suites/filesystem/file.txt'),
            dest = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'append_file.txt'),
            previous = "Some text",
            source_blob,
            dest_blob;

        valueOf(testRun, source).shouldNotBeNull();
        valueOf(testRun, dest).shouldNotBeNull();

        dest.write(previous);

        valueOf(testRun, function() {
            dest.append(source);
        }).shouldNotThrowException();

        source_blob = source.read();
        valueOf(testRun, source_blob).shouldNotBeNull();

        dest_blob = dest.read();
        valueOf(testRun, dest_blob).shouldNotBeNull();

        valueOf(testRun, dest_blob.text).shouldBe(previous + source_blob.text);

        finish(testRun);
    }

    this.resolveTest = function(testRun) {
        // Try to create non-empty file and check his method - resolve()
        var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'file.txt'),
            text = 'Some text',
            resolvedLink;

        if (file.exists()) {
            text = file.read().text;
        } else {
            file.write(text);
        }

        valueOf(testRun, function() {
            resolvedLink = file.resolve();
        }).shouldNotThrowException();

        valueOf(testRun, resolvedLink).shouldBeEqual(file.nativePath);
        valueOf(testRun, resolvedLink).shouldBeEqual(Ti.Filesystem.applicationDataDirectory + 'file.txt');

        finish(testRun);
    }
}