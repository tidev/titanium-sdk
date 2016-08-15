var bplistParser = require('bplist-parser'),
    bplistCreator = require('bplist-creator'),
    plist = require('plist'),
    fs = require('fs');

// reveal the underlying modules
exports.plist = plist;
exports.bplistCreator = bplistCreator;
exports.bplistParser = bplistParser;


// Parses the given file and returns its contents as a native JavaScript
// object.
exports.readFileSync = function(aFile) {
  var contents = fs.readFileSync(aFile);

  if (contents.length === 0) {
    console.error("Unable to read file '%s'", aFile);
    return {};
  }
  return exports.parse(contents, aFile);
};

exports.readFile = function(aFile, callback) {
  var results;

  fs.readFile(aFile, function(err, contents){
    if (err) {
      callback(err);
    }
    else {
      try {
        results = exports.parse(contents, aFile);
        callback(null,results);
      }
      catch(err) {
        callback(err);
      }
    }
  });
}

exports.writeFileSync = function(aFile, anObject, options) {
  var data = plist.build(anObject);
  fs.writeFileSync(aFile, data, options);
};

exports.writeFile = function(aFile, anObject, options, callback) {
  if (arguments.length === 3 && typeof options === 'function') {
    callback = options;
    options = undefined;
  }
  var data = plist.build(anObject);
  fs.writeFile(aFile, data, options, callback);
};

exports.writeBinaryFileSync = function(aFile, anObject, options) {
  var data = bplistCreator(anObject);
  fs.writeFileSync(aFile, data, options);
};

exports.writeBinaryFile = function(aFile, anObject, options, callback) {
  if (arguments.length === 3 && typeof options === 'function') {
    callback = options;
    options = undefined;
  }

  var data = bplistCreator(anObject);
  fs.writeFile(aFile, data, options, callback);
};

exports.stringify = function(anObject) {
  return plist.build(anObject);
};



exports.parse = function(aStringOrBuffer, aFile) {
  var results,
      firstByte = aStringOrBuffer[0];
  try {
    if (firstByte === 60 || firstByte === '<') {
      results = plist.parse(aStringOrBuffer.toString());
    }
    else if (firstByte === 98) {
      results = bplistParser.parseBuffer(aStringOrBuffer)[0];
    }
    else {
      if (aFile != undefined) {
        console.error("Unable to determine format for '%s'", aFile);
      }
      else {
        console.error("Unable to determine format for plist aStringOrBuffer: '%s'", aStringOrBuffer);
      }
      results = {};
    }
  }
  catch(e) {
    throw Error("'%s' has errors", aFile);
  }
  return results;
}
