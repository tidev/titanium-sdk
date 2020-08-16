'use strict';

var sub2 = require('./sub2'),
	sub3 = require('./sub3');

module.exports = {
	name: 'sub1.js',
	sub: sub2.name,
	sub3: sub3.name,
	filename: __filename,
	dirname: __dirname
};
