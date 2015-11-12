/**
 * node-appc - Appcelerator Common Library for Node.js
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var appc = require('../index'),
	version = appc.version;

describe('version', function () {
	it('namespace exists', function () {
		appc.should.have.property('version');
		appc.version.should.be.an.Object;
	});

	describe('#format()', function () {
		it('format integer versions', function () {
			version.format(1).should.equal('1');
			version.format(1, 1).should.equal('1');
			version.format(1, 2).should.equal('1.0');
			version.format(1, 3).should.equal('1.0.0');
			version.format(1, 4).should.equal('1.0.0.0');
			version.format(1, 0, 1).should.equal('1');
			version.format(1, 0, 2).should.equal('1');
			version.format(1, 0, 3).should.equal('1');
			version.format(1, 3, 3).should.equal('1.0.0');
		});

		it('format float versions', function () {
			version.format(1.2).should.equal('1.2');
			version.format(1.2, 1).should.equal('1.2');
			version.format(1.2, 2).should.equal('1.2');
			version.format(1.2, 3).should.equal('1.2.0');
			version.format(1.2, 0, 1).should.equal('1');
			version.format(1.2, 0, 2).should.equal('1.2');
			version.format(1.2, 0, 3).should.equal('1.2');
			version.format(1.2, 3, 3).should.equal('1.2.0');
		});

		it('format single segment versions', function () {
			version.format('1').should.equal('1');
			version.format('1', 1).should.equal('1');
			version.format('1', 2).should.equal('1.0');
			version.format('1', 3).should.equal('1.0.0');
			version.format('1', 4).should.equal('1.0.0.0');
			version.format('1', 0, 1).should.equal('1');
			version.format('1', 0, 2).should.equal('1');
			version.format('1', 0, 3).should.equal('1');
			version.format('1', 3, 3).should.equal('1.0.0');
			version.format('1-beta', 0, 1, true).should.equal('1');
			version.format('1-beta', 0, 2, true).should.equal('1');
			version.format('1-beta', 0, 3, true).should.equal('1');
			version.format('1-beta', 3, 3, true).should.equal('1.0.0');
		});

		it('format 2 segment versions', function () {
			version.format('1.2').should.equal('1.2');
			version.format('1.2', 1).should.equal('1.2');
			version.format('1.2', 2).should.equal('1.2');
			version.format('1.2', 3).should.equal('1.2.0');
			version.format('1.2', 4).should.equal('1.2.0.0');
			version.format('1.2', 0, 1).should.equal('1');
			version.format('1.2', 0, 2).should.equal('1.2');
			version.format('1.2', 0, 3).should.equal('1.2');
			version.format('1.2', 3, 3).should.equal('1.2.0');
			version.format('1.2-beta', 0, 1, true).should.equal('1');
			version.format('1.2-beta', 0, 2, true).should.equal('1.2');
			version.format('1.2-beta', 0, 3, true).should.equal('1.2');
			version.format('1.2-beta', 3, 3, true).should.equal('1.2.0');
		});

		it('format 3 segment versions', function () {
			version.format('1.2.3').should.equal('1.2.3');
			version.format('1.2.3', 1).should.equal('1.2.3');
			version.format('1.2.3', 2).should.equal('1.2.3');
			version.format('1.2.3', 3).should.equal('1.2.3');
			version.format('1.2.3', 4).should.equal('1.2.3.0');
			version.format('1.2.3', 0, 1).should.equal('1');
			version.format('1.2.3', 0, 2).should.equal('1.2');
			version.format('1.2.3', 0, 3).should.equal('1.2.3');
			version.format('1.2.3', 3, 3).should.equal('1.2.3');
			version.format('1.2.3-beta', 0, 1, true).should.equal('1');
			version.format('1.2.3-beta', 0, 2, true).should.equal('1.2');
			version.format('1.2.3-beta', 0, 3, true).should.equal('1.2.3');
			version.format('1.2.3-beta', 3, 3, true).should.equal('1.2.3');
			version.format('1.2.3-beta.foo', 3, 3, true).should.equal('1.2.3');
		});

		it('format 4 segment versions', function () {
			version.format('1.2.3.4').should.equal('1.2.3.4');
			version.format('1.2.3.4', 1).should.equal('1.2.3.4');
			version.format('1.2.3.4', 2).should.equal('1.2.3.4');
			version.format('1.2.3.4', 3).should.equal('1.2.3.4');
			version.format('1.2.3.4', 4).should.equal('1.2.3.4');
			version.format('1.2.3.4', 0, 1).should.equal('1');
			version.format('1.2.3.4', 0, 2).should.equal('1.2');
			version.format('1.2.3.4', 0, 3).should.equal('1.2.3');
			version.format('1.2.3.4', 3, 3).should.equal('1.2.3');
		});
	});

	describe('#eq()', function () {
		it('positive tests', function () {
			version.eq(1, 1).should.be.ok;
			version.eq('1', 1).should.be.ok;
			version.eq(1, '1').should.be.ok;
			version.eq('1', '1').should.be.ok;
			version.eq('1.0', '1').should.be.ok;
			version.eq('1.0.0', '1').should.be.ok;
			version.eq('1', '1.0').should.be.ok;
			version.eq('1.0', '1.0').should.be.ok;
			version.eq('1.0.0', '1.0').should.be.ok;
			version.eq('1', '1.0.0').should.be.ok;
			version.eq('1.0', '1.0.0').should.be.ok;
			version.eq('1.0.0', '1.0.0').should.be.ok;
			version.eq('1.0.0', '1.0.0.2').should.be.ok;
			version.eq('1.0.0.1', '1.0.0.2').should.be.ok;
		});

		it('negative tests', function () {
			version.eq('1.0.0', '1.2').should.not.be.ok;
			version.eq('1.2.3', '1.2').should.not.be.ok;
			version.eq('1', '1.2').should.not.be.ok;
			version.eq('1', 2).should.not.be.ok;
			version.eq('1', 1.2).should.not.be.ok;
			version.eq('1', '2').should.not.be.ok;
			version.eq('1.3', '1').should.not.be.ok;
		});
	});

	describe('#lt()', function () {
		it('positive tests', function () {
			version.lt(1, 2).should.be.ok;
			version.lt(1.2, 1.3).should.be.ok;
			version.lt(1.2, 2).should.be.ok;
			version.lt('1.2', 2).should.be.ok;
			version.lt('1.2', '1.3').should.be.ok;
			version.lt('1.2', '2').should.be.ok;
			version.lt('1.2', '1.2.1').should.be.ok;
		});

		it('negative tests', function () {
			version.lt(1, 1).should.not.be.ok;
			version.lt(1.2, 1.2).should.not.be.ok;
			version.lt('1.2', 1.2).should.not.be.ok;
			version.lt(1.2, '1.2').should.not.be.ok;
			version.lt('1.2', '1.2').should.not.be.ok;
			version.lt('1.2.3', '1.2').should.not.be.ok;
			version.lt('1.2', '1.2.0').should.not.be.ok;
			version.lt('1.2.1', '1.2').should.not.be.ok;
			version.lt('1.0.0.1', '1.0.0').should.not.be.ok;
		});
	});

	describe('#lte()', function () {
		it('positive tests', function () {
			version.lte(1, 2).should.be.ok;
			version.lte(1.2, 1.2).should.be.ok;
			version.lte(1.2, 1.3).should.be.ok;
			version.lte(1.2, 2).should.be.ok;
			version.lte('1.2', 1.2).should.be.ok;
			version.lte('1.2', 2).should.be.ok;
			version.lte('1.2', '1.2').should.be.ok;
			version.lte('1.2', '1.3').should.be.ok;
			version.lte('1.2', '2').should.be.ok;
			version.lte('1.2', '1.2.0').should.be.ok;
			version.lte('1.2', '1.2.1').should.be.ok;
			version.lte('1.2.0', '1.2.0').should.be.ok;
			version.lte('1.2.0', '1.2.1').should.be.ok;
			version.lte('1.0.0.1', '1.0.0').should.be.ok;
		});

		it('negative tests', function () {
			version.lte(1.1, 1).should.not.be.ok;
			version.lte('1.0.1', 1).should.not.be.ok;
			version.lte(1.3, 1.2).should.not.be.ok;
			version.lte('1.3', 1.2).should.not.be.ok;
			version.lte(1.3, '1.2').should.not.be.ok;
			version.lte('1.3', '1.2').should.not.be.ok;
			version.lte('1.2.3', '1.2').should.not.be.ok;
			version.lte('1.2.3', '1.2.0').should.not.be.ok;
		});
	});

	describe('#gt()', function () {
		it('positive tests', function () {
			version.gt(2, 1).should.be.ok;
			version.gt(1.3, 1.2).should.be.ok;
			version.gt(2, 1.2).should.be.ok;
			version.gt(2, '1.2').should.be.ok;
			version.gt('1.3', '1.2').should.be.ok;
			version.gt('2', '1.2').should.be.ok;
			version.gt('1.2.1', '1.2').should.be.ok;
		});

		it('negative tests', function () {
			version.gt(1, 1).should.not.be.ok;
			version.gt(1.2, 1.2).should.not.be.ok;
			version.gt('1.2', 1.2).should.not.be.ok;
			version.gt(1.2, '1.2').should.not.be.ok;
			version.gt('1.2', '1.2').should.not.be.ok;
			version.gt('1.2', '1.2.3').should.not.be.ok;
			version.gt('1.2.0', '1.2').should.not.be.ok;
			version.gt('1.2', '1.2.1').should.not.be.ok;
			version.gt('1.0.0', '1.0.0.1').should.not.be.ok;
		});
	});

	describe('#gte()', function () {
		it('positive tests', function () {
			version.gte(2, 1).should.be.ok;
			version.gte(1.2, 1.2).should.be.ok;
			version.gte(1.3, 1.2).should.be.ok;
			version.gte(2, 1.2).should.be.ok;
			version.gte(1.2, '1.2').should.be.ok;
			version.gte(2, '1.2').should.be.ok;
			version.gte('1.2', '1.2').should.be.ok;
			version.gte('1.3', '1.2').should.be.ok;
			version.gte('2', '1.2').should.be.ok;
			version.gte('1.2.0', '1.2').should.be.ok;
			version.gte('1.2.1', '1.2').should.be.ok;
			version.gte('1.2.0', '1.2.0').should.be.ok;
			version.gte('1.2.1', '1.2.0').should.be.ok;
			version.gte('1.0.0', '1.0.0.1').should.be.ok;
		});

		it('negative tests', function () {
			version.gte(1, 1.1).should.not.be.ok;
			version.gte(1, '1.0.1').should.not.be.ok;
			version.gte(1.2, 1.3).should.not.be.ok;
			version.gte(1.2, '1.3').should.not.be.ok;
			version.gte('1.2', 1.3).should.not.be.ok;
			version.gte('1.2', '1.3').should.not.be.ok;
			version.gte('1.2', '1.2.3').should.not.be.ok;
			version.gte('1.2.0', '1.2.3').should.not.be.ok;
		});
	});

	describe('#parseMin()', function () {
		it('finds minimum version', function () {
			version.parseMin('1').should.equal('1');
			version.parseMin('1.2').should.equal('1.2');
			version.parseMin('>=1.0').should.equal('1.0');
			version.parseMin('<1.0').should.equal('1.0');
			version.parseMin('>=2.3.3 <=4.2').should.equal('2.3.3');
			version.parseMin('>=2.3.3 <=4.2 || >=1.0').should.equal('1.0');
			version.parseMin('>=2.3.3 <=4.2 || 2.0').should.equal('2.0');
		});
	});

	describe('#parseMax()', function () {
		it('finds maximum version', function () {
			version.parseMax('1').should.equal('1');
			version.parseMax('1.2').should.equal('1.2');
			version.parseMax('>=1.0').should.equal('1.0');
			version.parseMax('<1.0').should.equal('1.0');
			version.parseMax('<18').should.equal('<18');
			version.parseMax('>=2.3.3 <=4.2').should.equal('4.2');
			version.parseMax('>=2.3.3 <=4.2.x').should.equal('4.2');
			version.parseMax('>=2.3.3 <=4.2.x', true).should.equal('4.2.x');
			version.parseMax('>=2.3.3 <=4.2 || >=1.0').should.equal('4.2');
			version.parseMax('>=2.3.3 <=4.2 || 5.0').should.equal('5.0');
		});
	});

	describe('#satisfies()', function () {
		it('in range', function () {
			version.satisfies('1.0.0', '1.0.0').should.equal(true);
			version.satisfies('1.0.0', '*').should.equal(true);
			version.satisfies('1.0.0', '>=2.0.0 || *').should.equal(true);
			version.satisfies('1.0.0', '>=1.0.0').should.equal(true);
			version.satisfies('3.0.0', '>=2.3.3 <=4.2').should.equal(true);
			version.satisfies('4', '>=2.3.3 <=4.2 || 5.0 || >=6.0').should.equal(true);
			version.satisfies('5', '>=2.3.3 <=4.2 || 5.0 || >=6.0').should.equal(true);
			version.satisfies('6', '>=2.3.3 <=4.2 || 5.0 || >=6.0').should.equal(true);
			version.satisfies('7', '>=2.3.3 <=4.2 || 5.0 || >=6.0').should.equal(true);
			version.satisfies('18.0.1', '<=18.x').should.equal(true);
			version.satisfies('18.0.1', '>=18.x').should.equal(true);
			version.satisfies('18.0.1', '>=19.x').should.equal(false);
		});

		it('not in range', function () {
			version.satisfies('2.0.0', '1.0.0').should.equal(false);
			version.satisfies('2.0.0', '>=2.3.3 <=4.2').should.equal(false);
			version.satisfies('2.3', '>=2.3.3 <=4.2').should.equal(false);
			version.satisfies('4.3', '>=2.3.3 <=4.2 || 5.0 || >=6.0').should.equal(false);
			version.satisfies('5.1', '>=2.3.3 <=4.2 || 5.0 || >=6.0').should.equal(false);
		});

		it('maybe', function () {
			version.satisfies('2.0', '1.0', true).should.equal('maybe');
			version.satisfies('2.0', '>=1.0', true).should.equal(true);
			version.satisfies('2.0', '<1.0', true).should.equal('maybe');
			version.satisfies('2.0', '>=2.3.3 <=4.2', true).should.equal(false);
			version.satisfies('5.0', '>=2.3.3 <=4.2', true).should.equal('maybe');
			version.satisfies('18', '>=10 <=18', true).should.equal(true);
		});
	});
});
