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
	
	// FileStream tests
	
	fileStreamTest:function() {
		valueOf(Ti.createBuffer).shouldBeFunction();
		valueOf(Ti.Filesystem.openStream).shouldBeFunction();
		
		var infile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'stream_test_in.txt');
		var outfile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory,'stream_test_out.txt');

		valueOf(infile).shouldBeObject();
		valueOf(outfile).shouldBeObject();
		valueOf(infile.open).shouldBeFunction();
		valueOf(outfile.open).shouldBeFunction();
		
		valueOf(infile.exists()).shouldBeTrue();
		valueOf(outfile.exists()).shouldBeTrue();
		
		var tempBufferLength = 50;
		
		var inStream = Ti.Filesystem.openStream(Ti.Filesystem.MODE_READ, infile);
		var inBuffer = Ti.createBuffer();
		var tempBuffer = Ti.createBuffer({length:tempBufferLength});

		valueOf(inStream).shouldBeObject();
		valueOf(inBuffer).shouldBeObject();
		valueOf(tempBuffer).shouldBeObject();
		valueOf(tempBuffer.length).shouldBe(tempBufferLength);

		valueOf(inStream.read).shouldBeFunction();
		valueOf(inStream.write).shouldBeFunction();
		
		var bytesRead = inStream.read(tempBuffer);
		while(bytesRead > -1) {
				Ti.API.info('bytes read ' + bytesRead);

	 	   	// buffer is expanded to contain the new data and the length is updated to reflect this
	    	var previousData = inBuffer.toString();
				inBuffer.append(tempBuffer);

				// assert that the append worked correctly
				valueOf(previousData + tempBuffer.toString()).shouldBe(inBuffer.toString());
				
		    // clear the buffer rather than creating a new temp one
		    tempBuffer.clear();
		
				bytesRead = inStream.read(tempBuffer);
		}		
		
		// assert that we can read/write successfully from the out file.

		var outStream = Ti.Filesystem.openStream(Ti.Filesystem.MODE_WRITE, outfile);
		outStream.write(inBuffer); //write inBuffer to outfile
		outStream.close();

		var outBuffer = Ti.createBuffer();
		outStream = Ti.Filesystem.openStream(Ti.Filesystem.MODE_READ, outfile);
		outStream.read(outBuffer); //read data from outfile into outBuffer

		Ti.API.info("inBuffer is " + inBuffer.toString());
		Ti.API.info("outBuffer is " + outBuffer.toString());

		valueOf(outBuffer.toString()).shouldBe(inBuffer.toString());	

		// pumping
		
		var pumpStream = outfile.open(Ti.Filesystem.MODE_READ);
		var step = 10;
		var pumpTotal = 0;
		
		valueOf(pumpStream).shouldBeObject();
		
		var pumpCallback = function(e) {
		    Ti.API.info('Received data chunk of size <' + e.bytesProcessed + '>');
				Ti.API.info('Received buffer <' + e.data + '>');
		    Ti.API.info('Total bytes received thus far <' + e.totalBytesProcessed + '>');

				valueOf(e.bytesProcessed).shouldBe(step);
				valueOf(e.totalBytesProcessed).shouldBe(step + pumpTotal);

				pumpTotal += e.bytesProcessed;
		};

		pumpStream.pump(pumpCallback, step);
		pumpStream.close();
		
		// stream operations

		var outFileStream = outfile.open(Ti.Filesystem.MODE_WRITE);
		var inBufferStream = Ti.Stream.createStream({source:inBuffer, mode:Ti.Filesystem.MODE_READ});
		
		valueOf(outFileStream).shouldBeObject();
		valueOf(inBufferStream).shouldBeObject();
		
		// writes all data from inBufferStream to outFileStream in chunks of 1024
		var bytesWritten = outFileStream.writeStream(inBufferStream, 1024);
		Ti.API.info('<' + bytesWritten + '> bytes written, closing both streams');

		// assert that the length of the outBuffer is equal to the amount of bytes that were written
		valueOf(bytesWritten).shouldBe(outBuffer.length);
		
		outFileStream.close();

		// end stream ops


		inStream.close();
		outStream.close();
	}
});
