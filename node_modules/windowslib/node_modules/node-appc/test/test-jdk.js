/**
 * node-appc - Appcelerator Common Library for Node.js
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var appc = require('../index');

function MockConfig() {
	this.get = function (s, d) {
		return d;
	};
}

describe('jdk', function () {
	it('namespace exists', function () {
		appc.should.have.property('jdk');
		appc.jdk.should.be.an.Object;
	});

	describe('#detect()', function () {
		it('should return valid result without specifying a config or options', function (done) {
			this.timeout(5000);

			appc.jdk.detect(function (result) {
				result.should.be.an.Object;

				if (result.version !== null) {
					result.version.should.be.a.String;
					result.version.should.match(/^(\d+\.)?(\d+\.)?(\*|\d+)$/);
				}

				if (result.build !== null) {
					result.build.should.be.a.String;
					result.build.should.match(/^\d+$/);
				}

				if (result.architecture !== null) {
					result.architecture.should.be.a.String;
					result.architecture.should.match(/^(32|64)bit$/);
				}

				if (result.executables !== null) {
					result.executables.should.be.an.Object;
				}

				if (result.issues !== null) {
					result.issues.should.be.an.Array;
				}

				done();
			});
		});

		it('should return valid result with a config and without specifying options', function (done) {
			this.timeout(5000);

			appc.jdk.detect(new MockConfig, function (result) {
				result.should.be.an.Object;
				done();
			});
		});

		it('should return valid result with a config and options', function (done) {
			this.timeout(5000);

			appc.jdk.detect(new MockConfig, { bypassCache: true }, function (result) {
				result.should.be.an.Object;
				done();
			});
		});
	});
});