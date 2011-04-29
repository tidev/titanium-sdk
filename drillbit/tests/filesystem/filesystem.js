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

	fileStreamPumpTest:function() {
		var pumpInputFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'stream_test_in.txt');
		valueOf(pumpInputFile).shouldBeObject();
		valueOf(pumpInputFile.open).shouldBeFunction();
		valueOf(pumpInputFile.exists()).shouldBeTrue();

		var step = 10;
		var pumpTotal = 0;
		var pumpCallback = function(e) {
			Ti.API.info('Received data chunk of size <' + e.bytesProcessed + '>');
			Ti.API.info('Received buffer <' + e.data + '>');
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
		var inBuffer = Ti.createBuffer({data:"huray for data, lets have a party for data1 huray for data, lets have a party for data2 huray for data, lets have a party for data3"});
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
	}
});
