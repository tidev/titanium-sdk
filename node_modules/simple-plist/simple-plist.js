var bplistParser = require('bplist-parser'),
	bplistCreator = require('bplist-creator'),
	plist = require('plist'),
	fs = require('fs');

// reveal the underlying modules
exports.plist = plist;
exports.bplistCreator = bplistCreator;
exports.bplistParser = bplistParser;


// Parses the given file and returns its contents as a native JavaScript object.
exports.readFileSync = function(aFile) {
	var results,
		contents = fs.readFileSync(aFile),
		firstByte = contents[0];

	if (contents.length === 0) {
		console.error("Unable to read file '%s'", aFile);
		return {};
	}

	try {
		if (firstByte === 60) {
			results = plist.parse(contents.toString());
		}
		else if (firstByte === 98) {
			results = bplistParser.parseBuffer(contents)[0];
		}
		else {
			console.error("Unable to determine format for '%s'", aFile);
			results = {};
		}
	}
	catch(e) {
		throw Error("'%s' has errors", aFile);
	}
	return results;
};




exports.writeFileSync = function(aFile, anObject, options) {
	var data = plist.build(anObject);
	fs.writeFileSync(aFile, data, options);
};




exports.writeBinaryFileSync = function(aFile, anObject, options) {
	var data = bplistCreator(anObject);
	fs.writeFileSync(aFile, data, options);
};




exports.stringify = function(anObject) {
	return plist.build(anObject);
};



exports.parse = function(aString) {
	return plist.parse(aString);
}
