global.should = null;
global.should = require('should');

var util = require('util');
global.dump = function () {
	for (var i = 0; i < arguments.length; i++) {
		console.error(util.inspect(arguments[i], false, null, true));
	}
};