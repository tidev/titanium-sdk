/**
 * node-appc - Appcelerator Common Library for Node.js
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var appc = require('../index');

describe('async', function () {
	it('namespace exists', function () {
		appc.should.have.property('async');
		appc.async.should.be.an.Object;
	});

	describe('#parallel()', function () {
		it('should run async tasks in parallel using same context', function (done) {
			function TestObj() {
				this.counter = 0;
			}

			var obj = new TestObj;

			appc.async.parallel(obj, [
				function (next) {
					this.counter++;
					next();
				},
				function (next) {
					this.counter++;
					next();
				},
				function (next) {
					this.counter++;
					next();
				}
			], function () {
				obj.counter.should.equal(3);
				done();
			});
		});

		it('should run sync tasks in parallel using same context', function (done) {
			function TestObj() {
				this.counter = 0;
			}

			var obj = new TestObj;

			appc.async.parallel(obj, [
				function () {
					this.counter++;
				},
				function () {
					this.counter++;
				},
				function () {
					this.counter++;
				}
			], function () {
				obj.counter.should.equal(3);
				done();
			});
		});
	});

	describe('#series()', function () {
		it('should run async tasks in series using same context', function (done) {
			function TestObj() {
				this.counter = 0;
			}

			var obj = new TestObj;

			appc.async.series(obj, [
				function (next) {
					this.counter++;
					next();
				},
				function (next) {
					this.counter++;
					next();
				},
				function (next) {
					this.counter++;
					next();
				}
			], function () {
				obj.counter.should.equal(3);
				done();
			});
		});

		it('should run sync tasks in series using same context', function (done) {
			function TestObj() {
				this.counter = 0;
			}

			var obj = new TestObj;

			appc.async.series(obj, [
				function () {
					this.counter++;
				},
				function () {
					this.counter++;
				},
				function () {
					this.counter++;
				}
			], function () {
				obj.counter.should.equal(3);
				done();
			});
		});
	});
});
