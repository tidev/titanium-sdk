/*global describe, Ti, valueOf */
describe("Ti.Filesystem tests", {
	
	optionalArgAPIs: function() {
		// https://appcelerator.lighthouseapp.com/projects/32238/tickets/2211-android-filesystem-test-generates-runtime-error
		var newDir = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'mydir');
		newDir.createDirectory();
		valueOf(newDir.exists()).shouldBeTrue();
		newDir.deleteDirectory();
		valueOf(newDir.exists()).shouldBeFalse();
	},
	readWriteText: function() {
		var TEXT = "This is my text";
		var FILENAME = 'test.txt';
		var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, FILENAME);
		if (file.exists()) {
			file.deleteFile();
		}
		file.write(TEXT);
		// nullify and re-create to test
		file = null;
		file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, FILENAME);
		valueOf(file.exists()).shouldBeTrue();
		var blob = file.read();
		valueOf(blob).shouldNotBeNull();
		var readText = blob.text;
		valueOf(readText).shouldNotBeNull();
		valueOf(readText).shouldNotBeUndefined();
		valueOf(readText).shouldBeString();
		valueOf(readText.length).shouldBe(TEXT.length);
		valueOf(readText).shouldBe(TEXT);
		file.deleteFile();
	},
	blobNativeFile: function() {
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
		valueOf(file.exists()).shouldBeTrue();
		var readphrase = file.read().text;
		valueOf(readphrase).shouldBe(testphrase);
	},
	blobFile: function() {
		var filename = 'blobtest';
		var testphrase = 'Revenge of the Blob';
		var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, filename);

		if (file.exists()) {
			file.deleteFile();
		}
		file.write(testphrase);
		var blob = file.read();
		var blobFile = blob.file;
		valueOf(blobFile.nativePath).shouldBe(file.nativePath);
		valueOf(blobFile.exists()).shouldBeTrue();
		var readphrase = blobFile.read().text;
		valueOf(readphrase).shouldBe(testphrase);
		file = null;
	},
	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2443-android-paths-beginning-with-are-not-recognised#ticket-2443-6
	dotSlash: function() {
		var f;
		var blob;
		valueOf(function(){f = Ti.Filesystem.getFile('./file.txt');}).shouldNotThrowException();
		valueOf(function(){blob = f.read();}).shouldNotThrowException();
		var text;
		valueOf(function(){text = blob.text;}).shouldNotThrowException();
		valueOf(text.length).shouldBeGreaterThan(0);
	},
	
	appendStringTest:function() {
		var f = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'data.txt');
		valueOf(f).shouldNotBeNull();

		var appended_text = 'Some appended text';
		var previous_text = "";
		
		// Check if the file exists before trying to read from it!

		if(f.exists()) {
			var prev_blob;

			valueOf(function() {
				prev_blob = f.read();
				previous_text = prev_blob.text;
			}).shouldNotThrowException();
		}

		f.write(appended_text, true);
		
		var final_blob = f.read();
		valueOf(final_blob).shouldNotBeNull();
		valueOf(final_blob.text).shouldBe(previous_text + appended_text);
	},
	appendBlobTest: function() {
		var blob = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'file.txt').read();
		var dest = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'append_blob.txt');
		
		valueOf(blob).shouldNotBeNull();
		valueOf(dest).shouldNotBeNull();
		
		var previous = "";
		
		if(dest.exists()) {
			var dest_blob = dest.read();
			valueOf(dest_blob).shouldNotBeNull();
			previous = dest_blob.text;
		}
		
		dest.write(blob, true);
		
		var final_blob = dest.read();
		valueOf(final_blob).shouldNotBeNull();
		valueOf(final_blob.text).shouldBe(previous + blob.text);
	},
	appendFileTest: function() {
		var source = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'file.txt');
		var dest 	 = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'append_file.txt');
		var previous = "";

		valueOf(source).shouldNotBeNull();
		valueOf(dest).shouldNotBeNull();
		
		if(dest.exists()) {
			previous = dest.read().text;
		}
		
		dest.write(source, true);
		
		var source_blob = source.read();
		valueOf(source_blob).shouldNotBeNull();
		
		var dest_blob = dest.read();
		valueOf(dest_blob).shouldNotBeNull();
		
		valueOf(dest_blob.text).shouldBe(previous + source_blob.text);		
	},
	// FileStream tests
	fileStreamBasicTest:function() {
		valueOf(Ti.createBuffer).shouldBeFunction();
		valueOf(Ti.Filesystem.openStream).shouldBeFunction();

		var resourceFileStream = Ti.Filesystem.openStream(Ti.Filesystem.MODE_READ, Ti.Filesystem.resourcesDirectory, 'stream_test_in.txt');
		valueOf(resourceFileStream).shouldBeObject();
		valueOf(resourceFileStream.read).shouldBeFunction();
		valueOf(resourceFileStream.write).shouldBeFunction();

		var inBuffer = Ti.createBuffer();
		valueOf(inBuffer).shouldBeObject();

		var tempBufferLength = 50;
		var tempBuffer = Ti.createBuffer({length:tempBufferLength});
		valueOf(tempBuffer).shouldBeObject();
		valueOf(tempBuffer.length).shouldBe(tempBufferLength);

		var bytesRead = resourceFileStream.read(tempBuffer);
		while(bytesRead > -1) {
			Ti.API.info('bytes read ' + bytesRead);

	 	   	// buffer is expanded to contain the new data and the length is updated to reflect this
			var previousData = inBuffer.toString();
			inBuffer.append(tempBuffer);

			// assert that the append worked correctly
			valueOf(previousData + tempBuffer.toString()).shouldBe(inBuffer.toString());
				
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
			valueOf(inBuffer[i]).shouldBeExactly(outBuffer[i]);
		}
	},

	fileStreamWriteTest:function() {
		var infile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'stream_test_in.txt');
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
		valueOf(totalReadSize).shouldBeExactly(totalWriteSize);
		instream.close();
	},

	fileStreamAppendTest:function() {
		var infile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'stream_test_in.txt');
		var instream = infile.open(Ti.Filesystem.MODE_READ);
		var outfile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'fsappendtest.jpg');
		if(outfile.exists()) {
			outfile.deleteFile();
		}
		var outstream = outfile.open(Ti.Filesystem.MODE_WRITE);

		var bytesStreamed = Ti.Stream.writeStream(instream, outstream, 40);
		instream.close();
		outstream.close();

		infile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'stream_test_in.txt');
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
		valueOf(totalReadSize).shouldBeExactly(bytesStreamed + totalWriteSize);
		instream.close();
	},

	fileStreamPumpTest:function() {
		var pumpInputFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'stream_test_in.txt');
		valueOf(pumpInputFile).shouldBeObject();
		valueOf(pumpInputFile.open).shouldBeFunction();
		valueOf(pumpInputFile.exists()).shouldBeTrue();

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

			valueOf(e.bytesProcessed).shouldBe(step);
			valueOf(e.totalBytesProcessed).shouldBe(step + pumpTotal);

			pumpTotal += e.bytesProcessed;
		};

		var pumpStream = pumpInputFile.open(Ti.Filesystem.MODE_READ);
		valueOf(pumpStream).shouldBeObject();

		Ti.Stream.pump(pumpStream, pumpCallback, step);
		pumpStream.close();
	},

	fileStreamWriteStreamTest:function() {
		var inBuffer = Ti.createBuffer({value:"huray for data, lets have a party for data1 huray for data, lets have a party for data2 huray for data, lets have a party for data3"});
		valueOf(inBuffer).shouldBeObject();
		var inStream = Ti.Stream.createStream({source:inBuffer, mode:Ti.Stream.MODE_READ});
		valueOf(inStream).shouldNotBeNull();

		var outFileStream = Ti.Filesystem.openStream(Ti.Filesystem.MODE_WRITE, Ti.Filesystem.applicationDataDirectory, 'stream_test_out.txt');
		valueOf(outFileStream).shouldBeObject();

		// writes all data from inBufferStream to outFileStream in chunks of 30
		var bytesWritten = Ti.Stream.writeStream(inStream, outFileStream, 30);
		Ti.API.info('<' + bytesWritten + '> bytes written, closing both streams');

		// assert that the length of the outBuffer is equal to the amount of bytes that were written
		valueOf(bytesWritten).shouldBe(inBuffer.length);

		outFileStream.close();
	},

	fileStreamResourceFileTest:function() {
		if(Ti.Platform.osname === 'android') {
			valueOf(function() {Ti.Filesystem.openStream(Ti.Filesystem.MODE_WRITE, Ti.Filesystem.resourcesDirectory, 'stream_test_in.txt')}).shouldThrowException();
			valueOf(function() {Ti.Filesystem.openStream(Ti.Filesystem.MODE_APPEND, Ti.Filesystem.resourcesDirectory, 'stream_test_in.txt')}).shouldThrowException();

			valueOf(function() {
				var resourceFileStream = Ti.Filesystem.openStream(Ti.Filesystem.MODE_READ, Ti.Filesystem.resourcesDirectory, 'stream_test_in.txt');
				resourceFileStream.close()
			}).shouldNotThrowException();
		}
	},

	fileStreamTruncateTest:function() {
		var inBuffer = Ti.createBuffer({value:"huray for data, lets have a party for data1 huray for data, lets have a party for data2 huray for data, lets have a party for data3"});
		valueOf(inBuffer).shouldBeObject();
		var inStream = Ti.Stream.createStream({source:inBuffer, mode:Ti.Stream.MODE_READ});
		valueOf(inStream).shouldNotBeNull();

		var outFileStream = Ti.Filesystem.openStream(Ti.Filesystem.MODE_WRITE, Ti.Filesystem.applicationDataDirectory, 'stream_test_truncate.txt');
		valueOf(outFileStream).shouldBeObject();

		// writes all data from inBufferStream to outFileStream in chunks of 30
		var bytesWritten = Ti.Stream.writeStream(inStream, outFileStream, 30);
		Ti.API.info('<' + bytesWritten + '> bytes written, closing both streams');

		// assert that the length of the outBuffer is equal to the amount of bytes that were written
		valueOf(bytesWritten).shouldBe(inBuffer.length);
		outFileStream.close();

		var outFileStream = Ti.Filesystem.openStream(Ti.Filesystem.MODE_WRITE, Ti.Filesystem.applicationDataDirectory, 'stream_test_truncate.txt');
		valueOf(outFileStream).shouldBeObject();
		outFileStream.close();

		var inFileStream = Ti.Filesystem.openStream(Ti.Filesystem.MODE_READ, Ti.Filesystem.applicationDataDirectory, 'stream_test_truncate.txt');
		valueOf(inFileStream).shouldBeObject();

		var truncateBuffer = Ti.Stream.readAll(inFileStream);
		valueOf(truncateBuffer.length).shouldBeExactly(0);

		inFileStream.close();
	},

	fileMove: function() {
		var f = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, 'text.txt');
		var contents = f.read();

		var newDir = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory,'movedir');
		if(!newDir.exists()) {
			newDir.createDirectory();
		}
		valueOf(newDir.exists()).shouldBeTrue();

		var newFile = Titanium.Filesystem.getFile(newDir.nativePath,'newfile.txt');
		newFile.write(f.read());
		valueOf(newFile.exists()).shouldBeTrue();

		// remove destination file if it exists otherwise the test will fail on multiple runs
		var destinationFile = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory+'/moved.txt');
		if(destinationFile.exists()) {
			destinationFile.deleteFile();
		}

		valueOf(newFile.move(Titanium.Filesystem.applicationDataDirectory+'/moved.txt')).shouldBeTrue();
	},

	tempDirTest:function() {
		var filename = "drillbit_temp_file.txt";
		valueOf(Ti.Filesystem.getTempDirectory).shouldBeFunction();

		var outBuffer = Ti.createBuffer({value:"huray for data, lets have a party for data1 huray for data, lets have a party for data2 huray for data, lets have a party for data3"});
		valueOf(outBuffer).shouldBeObject();

		var tempFileOutStream = Ti.Filesystem.openStream(Ti.Filesystem.MODE_WRITE, Ti.Filesystem.tempDirectory, filename);
		tempFileOutStream.write(outBuffer); //write inBuffer to outfile
		tempFileOutStream.close();

		var inBuffer = Ti.createBuffer({length:200}); // have to set length on read buffer or no data will be read
		var tempFileInStream = Ti.Filesystem.openStream(Ti.Filesystem.MODE_READ, Ti.Filesystem.tempDirectory, filename);
		bytesRead = tempFileInStream.read(inBuffer); //read 200 byes of data from outfile into outBuffer
		tempFileInStream.close();

		for (var i=0; i < bytesRead; i++) {
			valueOf(inBuffer[i]).shouldBeExactly(outBuffer[i]);
		}
	},

	emptyFile: function() {
		var emptyFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, "empty.txt");
		valueOf(emptyFile).shouldNotBeNull();
		valueOf(emptyFile.size).shouldBe(0);

		var blob = emptyFile.read();
		valueOf(blob.length).shouldBe(0);
		valueOf(blob.text).shouldBe("");
		valueOf(blob.toString()).shouldBe("");
	},
	
	fileSize:function() {
		
		// For now, all we can do is make sure the size is not 0
		// without dumping a file of an exact size
		
		// NOTE: Android might be failing this right now; I only
		// found a getSize() op in their code.
		
		var testFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, "file.txt");
		valueOf(testFile).shouldNotBeNull();
		valueOf(testFile.size).shouldNotBe(0);

		var blob = testFile.read();
		valueOf(blob.length).shouldNotBe(0);
	},
	
	mimeType:function() {
	
		var files = ['test.xml','test.txt','test.js','test.htm','test.html','test.svg','test.svgz','test.png','test.jpg','test.jpeg','test.gif','test.wav','test.mp4','test.mov','test.mpeg','test.m4v'];
	
		//Use common suffix when more than 1 mimeType is associated with an extension.
		//Otherwise use full mimeType for comparison
		var extensions = ['xml','text/plain','javascript','text/html','text/html','image/svg+xml','image/svg+xml','image/png','image/jpeg','image/jpeg','image/gif','wav','mp4','video/quicktime','mpeg','video/x-m4v'];
	
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
			valueOf(file1).shouldNotBeNull();

			var blob1 = file1.read();
			valueOf(blob1).shouldNotBeNull();
			var mimeType = blob1.mimeType;
			
			var result = ( (mimeType.length >= testExt.length) && (mimeType.substr(mimeType.length - testExt.length) == testExt) );
			
			Ti.API.info(filename+" "+mimeType+" "+testExt);
			valueOf(result).shouldBeTrue();
	
		}
	}
});
