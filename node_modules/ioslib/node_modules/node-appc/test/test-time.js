/**
 * node-appc - Appcelerator Common Library for Node.js
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var appc = require('../index'),
	time = appc.time;

describe('time', function () {
	it('namespace exists', function () {
		appc.should.have.property('time');
		appc.time.should.be.an.Object;
	});

	describe('#prettyDiff()', function () {
		var dt1 = new Date,
			dt2 = new Date,
			dt3 = new Date,
			dt4 = new Date,
			dt5 = new Date,
			dt6 = new Date,
			dt7 = new Date;

		dt1.setTime(1372893710058); // Wed Jul 03 2013 16:21:55 GMT-0700 (PDT)
		dt2.setTime(dt1.getTime() + 15); // add 15 milliseconds
		dt3.setTime(dt1.getTime() + 30012); // add 30 seconds, 12 milliseconds
		dt4.setTime(dt1.getTime() + 60000); // add 1 minute
		dt5.setTime(dt1.getTime() + 764006); // add 12 minutes, 44 seconds, 6 milliseconds
		dt6.setTime(dt1.getTime() + 22998389); // add 6 hours, 23 minutes, 18 seconds, 389 milliseconds
		dt7.setTime(dt1.getTime() + 315942010); // add 3 days, 15 hours, 45 minutes, 42 seconds, 10 milliseconds

		it('same dates', function () {
			time.prettyDiff(dt1, dt1).should.equal('0ms');
			time.prettyDiff(dt1, dt1, { colorize: true }).should.equal('0'.cyan + 'ms');
			time.prettyDiff(dt1, dt1, { hideMS: true }).should.equal('');
			time.prettyDiff(dt1, dt1, { showFullName: true }).should.equal('0ms');
		});

		it('milliseconds diff', function () {
			time.prettyDiff(dt1, dt2).should.equal('15ms');
			time.prettyDiff(dt2, dt1).should.equal('15ms');
			time.prettyDiff(dt1, dt2, { colorize: true }).should.equal('15'.cyan + 'ms');
			time.prettyDiff(dt1, dt2, { hideMS: true }).should.equal('');
			time.prettyDiff(dt1, dt2, { showFullName: true }).should.equal('15ms');
		});

		it('seconds diff', function () {
			time.prettyDiff(dt1, dt3).should.equal('30s 12ms');
			time.prettyDiff(dt1, dt3, { colorize: true }).should.equal('30'.cyan + 's ' + '12'.cyan + 'ms');
			time.prettyDiff(dt1, dt3, { hideMS: true }).should.equal('30s');
			time.prettyDiff(dt1, dt3, { showFullName: true }).should.equal('30 seconds 12ms');
		});

		it('minute diff', function () {
			time.prettyDiff(dt1, dt4).should.equal('1m');
			time.prettyDiff(dt1, dt4, { colorize: true }).should.equal('1'.cyan + 'm');
			time.prettyDiff(dt1, dt4, { hideMS: true }).should.equal('1m');
			time.prettyDiff(dt1, dt4, { showFullName: true }).should.equal('1 minute');
		});

		it('minutes diff', function () {
			time.prettyDiff(dt1, dt5).should.equal('12m 44s 6ms');
			time.prettyDiff(dt1, dt5, { colorize: true }).should.equal('12'.cyan + 'm ' + '44'.cyan + 's ' + '6'.cyan + 'ms');
			time.prettyDiff(dt1, dt5, { hideMS: true }).should.equal('12m 44s');
			time.prettyDiff(dt1, dt5, { showFullName: true }).should.equal('12 minutes 44 seconds 6ms');
		});

		it('hours diff', function () {
			time.prettyDiff(dt1, dt6).should.equal('6h 23m 18s 389ms');
			time.prettyDiff(dt1, dt6, { colorize: true }).should.equal('6'.cyan + 'h ' + '23'.cyan + 'm ' + '18'.cyan + 's ' + '389'.cyan + 'ms');
			time.prettyDiff(dt1, dt6, { hideMS: true }).should.equal('6h 23m 18s');
			time.prettyDiff(dt1, dt6, { showFullName: true }).should.equal('6 hours 23 minutes 18 seconds 389ms');
		});

		it('days diff', function () {
			time.prettyDiff(dt1, dt7).should.equal('3d 15h 45m 42s 10ms');
			time.prettyDiff(dt1, dt7, { colorize: true }).should.equal('3'.cyan + 'd ' + '15'.cyan + 'h ' + '45'.cyan + 'm ' + '42'.cyan + 's ' + '10'.cyan + 'ms');
			time.prettyDiff(dt1, dt7, { hideMS: true }).should.equal('3d 15h 45m 42s');
			time.prettyDiff(dt1, dt7, { showFullName: true }).should.equal('3 days 15 hours 45 minutes 42 seconds 10ms');
		})
	});

	describe('#timestamp()', function () {
		it('creates timestamp in correct format', function () {
			time.timestamp().should.match(/\d{4}\-\d{2}\-\d{2}T\d{2}\:\d{2}\:\d{2}\.\d{3}\+\d{4}/);
		});
	});
});
