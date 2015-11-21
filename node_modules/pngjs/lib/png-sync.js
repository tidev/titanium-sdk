'use strict';


var parse = require('./parser-sync');


exports.read = function(buffer, options) {

  return parse(buffer, options || {});
};
