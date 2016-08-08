# always-tail

Node.js module for continuously tailing a file.

It differs from other `tail` modules in that it survives truncates, 
file rollovers (e.g. `mv /var/log/test /var/log/test.1`), and unlink.

It does this by monitoring the filename, and when the inode changes, 
it will continue to read to the end of the existing file descriptor, then 
automatically read from the newly created file with the same name.

It emits a 'line' event when a new line is read. 

## Installation

`npm install always-tail`

## Example

```js
var Tail = require('always-tail');
var fs = require('fs');
var filename = "/tmp/testlog";

if (!fs.existsSync(filename)) fs.writeFileSync(filename, "");

var tail = new Tail(filename, '\n');

tail.on('line', function(data) {
  console.log("got line:", data);
});


tail.on('error', function(data) {
  console.log("error:", data);
});

tail.watch();

// to unwatch and close all file descriptors, tail.unwatch();
```

## Usage 

```js
var tail = new Tail(filename, separator, options); 
```

`filename` - filename to monitor

`separator` - optional separator for each line (default: \n)

`options.interval` - optional interval to check for changes

`options.start` - optional start byte to start reading from 

`options.blockSize` - maximum reading block size (default is 1 MB)

## Credits

Code is heavily modified from the node-tail module (https://github.com/forward/node-tail)

## License

MIT 
