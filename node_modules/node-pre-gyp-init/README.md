# node-pre-gyp-init

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Deps][david-image]][david-url]
[![Dev Deps][david-dev-image]][david-dev-url]

`node-pre-gyp-init` complements [node-pre-gyp][node-pre-gyp-url] by providing
runtime native binding resolution and automatic native module compilation.

In other words, you can safely change your Node.js version and if you are
missing the appropriate compiled native binary, it will asynchronously invoke
node-pre-gyp to either download or compile the required binary.

## Installation

    npm install node-pre-gyp-init

## Examples

If you are a native module author, one way to use `node-pre-gyp-init` is to call
`init()` from all of your public JavaScript APIs. Since `node-pre-gyp-init` is
async, your JavaScript API will also need to be async.

```javascript
var init = require('node-pre-gyp-init');

module.exports.myNativeFunction = function (callback) {
    init(path.resolve(__dirname, './package.json'), function (err, bindingPath) {
		if (err) {
            return callback(err);
        }

		var binding = require(bindingPath);
        var result = binding.whatever();
        callback(null, result);
	});
};
```

If you are trying to use someone else's native module, then you can do something
like:

```javascript
var init = require('node-pre-gyp-init');
var modulePath = require.resolve('some-native-module');

init(path.resolve(modulePath, './package.json'), function (err, bindingPath) {
    if (err) {
        console.error(err);
        return;
    }

    var someNativeModule = require('some-native-module');
    someNativeModule.doNativeThings();
});
```

In the above example, `node-pre-gyp-init` is simply being used to make sure the
native binding exists before requiring the actual native module.

## API

init(pathToPackageJson, callback)

 * `pathToPackageJson` (string) - The path to the native module's package.json.
 * `callback(err, bindingPath)` (function) - A function to call after resolving
   the binding path.

Returns an `EventEmitter` where you can listen for the following events:

 * `success` - The native binding was found.

   Parameters:
   * `bindingPath` (string) - The path to the resolved native module.


 * `error` - Failed to install the pre-compiled binding or locate the binding
   after it was successfully compiled.

   Parameters:
   * `err` (Error) - The error details. If the error was because of a build
     error, then the return code is stored in `err.code`.


 * `stdout` and `stderr` - Output directly from the `node-pre-gyp` subprocess.
   This is handy if you need to debug what `node-pre-gyp` is doing.

   Parameters:
   * `output` (string) - The output from `node-pre-gyp`.

## License

(The MIT License)

Copyright (c) 2016 Chris Barber

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

[npm-image]: https://img.shields.io/npm/v/node-pre-gyp-init.svg
[npm-url]: https://npmjs.org/package/node-pre-gyp-init
[downloads-image]: https://img.shields.io/npm/dm/node-pre-gyp-init.svg
[downloads-url]: https://npmjs.org/package/node-pre-gyp-init
[david-image]: https://img.shields.io/david/cb1kenobi/node-pre-gyp-init.svg
[david-url]: https://david-dm.org/cb1kenobi/node-pre-gyp-init
[david-dev-image]: https://img.shields.io/david/dev/cb1kenobi/node-pre-gyp-init.svg
[david-dev-url]: https://david-dm.org/cb1kenobi/node-pre-gyp-init#info=devDependencies
[node-pre-gyp-url]: https://github.com/mapbox/node-pre-gyp
