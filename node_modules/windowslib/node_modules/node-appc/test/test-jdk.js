/**
 * node-appc - Appcelerator Common Library for Node.js
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var appc = require('../index');

global.should = null;
global.should = require('should');

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

			function checkJDK(jdk) {
				should(jdk).be.an.Object;
				should(jdk).have.properties('home', 'version', 'build', 'executables', 'architecture');
				should(jdk.home).be.a.String;
				should(jdk.version).be.a.String;
				should(jdk.version).match(/^(\d+\.)?(\d+\.)?(\*|\d+)$/);
				should(jdk.build).be.a.String;
				should(jdk.build).match(/^\d+$/);
				should(jdk.executables).be.a.Object;
				should(jdk.architecture).be.a.String;
				should(jdk.architecture).match(/^(32|64)bit/);
			}

			appc.jdk.detect(function (result) {
				should(result).be.an.Object;

				should(result).have.keys('jdks', 'home', 'version', 'build', 'executables', 'issues', 'architecture');

				should(result.jdks).be.an.Object;
				Object.keys(result.jdks).forEach(function (jdk) {
					checkJDK(result.jdks[jdk]);
				});

				checkJDK(result);

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