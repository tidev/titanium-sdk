
/**
 * Module dependencies.
 */

var fs = require('fs');
var size = require('./');

// [path]
var path = process.argv[2];

// 473 x 315
var buf = fs.readFileSync(path);
var s = size(buf);

console.log('%s : %sx%s', path, s.width, s.height);
