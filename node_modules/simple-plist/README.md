node-simple-plist
=================

A simple API for interacting with binary and plain text plist data.


## Installation
```sh
$ npm install simple-plist
```


## Reading Data
```js
var plist = require('simple-plist');

// Read data from a file (xml or binary) (asynchronous)
plist.readFile('/path/to/some.plist', function(err,data){
	if (err) {throw err;}
	console.log( JSON.stringify(data) );
});

// Read data from a file (xml or binary) (synchronous)
var data = plist.readFileSync('/path/to/some.plist');
console.log( JSON.stringify(data) );
```


## Writing Data
```js
var plist = require('simple-plist'),
	data = plist.readFileSync('/path/to/some.plist');

// Write data to a xml file (asynchronous)
plist.writeFile('/path/to/plaintext.plist', data, function(err){
	if (err) { throw err; }
});

// Write data to a xml file (synchronous)
plist.writeFileSync('/path/to/plaintext.plist', data);

// Write data to a binary plist file (asynchronous)
plist.writeBinaryFile('/path/to/binary.plist', data, function(err){
	if (err) { throw err; }
});

// Write data to a binary plist file (synchronous)
plist.writeBinaryFileSync('/path/to/binary.plist', data);
```


## Mutating Plists In Memory
```js
var plist = require('simple-plist');

// Convert a Javascript object to a plist xml string
var xml = plist.stringify( {name: "Joe", answer:42} );
console.log(xml); // output is a valid plist xml string

// Convert a plist xml string or a binary plist buffer to a Javascript object
var data = plist.parse("<plist><dict><key>name</key><string>Joe</string></dict></plist>");
console.log( JSON.stringify(data) );
```
