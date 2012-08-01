# require-all

An easy way to require all files within a directory.

## Usage

```js
var controllers = require('require-all')({
  dirname: __dirname + '/controllers',
  filter: /(.+Controller)\.js$/,
});

// controllers now is an object with references to all modules matching the filter
// for example:
// { HomeController: function HomeController() {...}, ...}
```
