/**
 * node-appc - Appcelerator Common Library for Node.js
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var appc = require('../index'),
	util = appc.util;

describe('util', function () {
	it('namespace exists', function () {
		appc.should.have.property('util');
		appc.util.should.be.an.Object;
	});

	describe('#mix()', function () {
		it('should mix two objects overriding child objects', function () {
			util.mix({}, {}).should.eql({});

			util.mix({a:1}, {}).should.eql({a:1});

			util.mix({a:1}, {b:2}).should.eql({a:1,b:2});

			util.mix({a:1}, {a:2}).should.eql({a:2});

			util.mix({a:1, c:{d:1}}, {c:{e:2}}).should.eql({a:1, c:{e:2}});
		});

		it('should mix three objects overriding child objects', function () {
			util.mix({}, {}, {}).should.eql({});

			util.mix({a:1}, {}, {b:2}).should.eql({a:1, b:2});

			util.mix({a:1}, {b:2}, {c:3}).should.eql({a:1, b:2, c:3});

			util.mix({a:1}, {a:2}, {a:3}).should.eql({a:3});

			util.mix({a:1, c:{d:1}}, {c:{e:2}}, {c:{f:3}}).should.eql({a:1, c:{f:3}});
		});
	});

	describe('#mixObj()', function () {
		it('should deep mix two objects', function () {
			util.mixObj({}, {}).should.eql({});

			util.mixObj({a:1}, {}).should.eql({a:1});

			util.mixObj({a:1}, {b:2}).should.eql({a:1,b:2});

			util.mixObj({a:1}, {a:2}).should.eql({a:2});

			util.mixObj({a:1, c:{d:1}}, {c:{e:2}}).should.eql({a:1, c:{d:1, e:2}});
		});

		it('should deep mix three objects', function () {
			util.mixObj({}, {}, {}).should.eql({});

			util.mixObj({a:1}, {}, {b:2}).should.eql({a:1, b:2});

			util.mixObj({a:1}, {b:2}, {c:3}).should.eql({a:1, b:2, c:3});

			util.mixObj({a:1}, {a:2}, {a:3}).should.eql({a:3});

			util.mixObj({a:1, c:{d:1}}, {c:{e:2}}, {c:{f:3}}).should.eql({a:1, c:{d:1, e:2, f:3}});
		});
	});
});
