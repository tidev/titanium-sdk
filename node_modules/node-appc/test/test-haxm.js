/**
 * node-appc - Appcelerator Common Library for Node.js
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var appc = require('../index'),
	assert = require('assert');

describe('haxm', function () {
	it('namespace exists', function () {
		appc.should.have.property('haxm');
		appc.haxm.should.be.an.Object;
	});

	describe('#detect()', function () {
		it('should return valid result without specifying a config or options', function (done) {
			appc.haxm.detect(function (result) {
				result.should.be.an.Object;

				result.installed.should.be.a.Boolean;

				if (result.memlimit !== null) {
					result.memlimit.should.be.a.Number;
					assert(result.memlimit >= 0, 'mem limit should be a positive integer')
				}

				done();
			});
		});

		it('should return valid result with a config and without specifying options', function (done) {
			appc.haxm.detect({}, function (result) {
				result.should.be.an.Object;

				result.installed.should.be.a.Boolean;

				if (result.memlimit !== null) {
					result.memlimit.should.be.a.Number;
					assert(result.memlimit >= 0, 'mem limit should be a positive integer')
				}

				done();
			});
		});

		it('should return valid result with a config and options', function (done) {
			appc.haxm.detect({}, { bypassCache: true }, function (result) {
				result.should.be.an.Object;

				result.installed.should.be.a.Boolean;

				if (result.memlimit !== null) {
					result.memlimit.should.be.a.Number;
					assert(result.memlimit >= 0, 'mem limit should be a positive integer')
				}

				done();
			});
		});
	});
});