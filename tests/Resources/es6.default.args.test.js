/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2017 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
var should = require('./utilities/assertions'),
	utilities = require('./utilities/utilities');

describe('ES6 Default Arguments', function () {

	it('assigns default value to argument not passed explicitly', function () {
    var result;
    function f(x, y=12) {
      // y is 12 if not passed (or passed as undefined)
      return x + y;
    }
    result = f(3);
    result.should.eql(15);
	});
});
