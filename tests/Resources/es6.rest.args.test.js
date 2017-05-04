/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2017 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
var should = require('./utilities/assertions'),
	utilities = require('./utilities/utilities');

describe('ES6 Rest Arguments', function () {

	it('assigns rest arguments', function () {
		var result;
		function f(x, ...y) {
			// y is an Array
			return x * y.length;
		}
		result = f(3, "hello", true);
		result.should.eql(6);
	});
});
