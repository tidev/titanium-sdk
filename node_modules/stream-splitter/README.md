# stream-splitter

[![build status](https://secure.travis-ci.org/samcday/node-stream-splitter.png)](http://travis-ci.org/samcday/node-stream-splitter)

Split them streams, in style!

```javascript
var fs = require("fs");
var StreamSplitter = require("stream-splitter");

var splitter = fs.createReadStream("afile.txt").pipe(StreamSplitter("\n"));

// Set encoding on the splitter Stream, so tokens come back as a String.
splitter.encoding = "utf8";

splitter.on("token", function(token) {
	console.log("A line of input:", token);
});

splitter.on("done", function() {
	console.log("And that's all folks!");
});

splitter.on("error", function(err) {
	// Any errors that occur on a source stream will be emitted on the 
	// splitter Stream, if the source stream is piped into the splitter 
	// Stream, and if the source stream doesn't have any other error
	// handlers registered.
	console.error("Oh noes!", err);
});
```

## Installation

`npm install stream-splitter`

## API

```javascript
StreamSplitter = require("stream-splitter")
```

`StreamSplitter` accepts a single argument, and returns a `WritableStream`:

```javascript
	aWritableStream = StreamSplitter(token);
```

## Usage

See the example above. Some notes:

* The WritableStream returned will sense if you pipe a stream into it, and will 
register an error handler on the source stream. If an error occurs on the source
stream and you don't have any other handlers registered, the returned 
WritableStream will emit the source stream `error` for you. This enables you to
chain a newly created ReadableStream straight into a StreamSplitter.
* The emitted tokens will be `Buffer`s unless you set the splitter Stream 
`encoding` field.
* This lib is designed to be as efficient as possible, making use of 
substack/node-buffers library to avoid unnecessary `Buffer` allocations/copies.

## Tests

Checkout the repository and run

`npm install && npm test`

## (Un)License

This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any
means.

In jurisdictions that recognize copyright laws, the author or authors
of this software dedicate any and all copyright interest in the
software to the public domain. We make this dedication for the benefit
of the public at large and to the detriment of our heirs and
successors. We intend this dedication to be an overt act of
relinquishment in perpetuity of all present and future rights to this
software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <http://unlicense.org/>
