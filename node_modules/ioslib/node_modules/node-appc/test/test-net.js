/**
 * node-appc - Appcelerator Common Library for Node.js
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var appc = require('../index');

describe('net', function () {
	it('namespace exists', function () {
		appc.should.have.property('net');
		appc.net.should.be.an.Object;
	});

	describe('#interfaces()', function () {
		it('result is valid', function (done) {
			appc.net.interfaces(function (result) {
				result.should.be.an.Object;

				// find at least 1 interface
				Object.keys(result).length.should.be.greaterThan(0);

				Object.keys(result).forEach(function (dev) {
					result[dev].should.be.an.Object;
					result[dev].should.have.property('ipAddresses');
					result[dev].ipAddresses.should.be.an.instanceOf(Array);
					result[dev].ipAddresses.length.should.be.greaterThan(0);
					if (result[dev].macAddress) {
						result[dev].macAddress.should.be.a.String;
					}
					if (result[dev].gateway) {
						result[dev].gateway.should.be.a.String;
					}
				});

				done();
			});
		});

		it('results cached', function (done) {
			appc.net.interfaces(function (result1) {
				appc.net.interfaces(function (result2) {
					result1.should.equal(result2);
					done();
				});
			});
		});
	});

	describe('#urlEncode()', function () {
		it('properly encode string', function () {
			appc.net.urlEncode({
				name: 'Chris Barber'
			}).should.equal('name=Chris%20Barber');
		});

		it('properly encode boolean', function () {
			appc.net.urlEncode({
				hacker: true
			}).should.equal('hacker=true');
		});

		it('properly encode number', function () {
			appc.net.urlEncode({
				dailyRedbullsConsumed: 3
			}).should.equal('dailyRedbullsConsumed=3');
		});

		it('properly encode multiple values', function () {
			appc.net.urlEncode({
				name: 'Chris Barber',
				hacker: true,
				dailyRedbullsConsumed: 3
			}).should.equal('name=Chris%20Barber&hacker=true&dailyRedbullsConsumed=3');
		});
	});
});
