/**
 * node-appc - Appcelerator Common Library for Node.js
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var appc = require('../index'),
	AppcException = appc.exception;

describe('exception', function () {
	it('namespace exists', function () {
		appc.should.have.property('exception');
		appc.exception.should.be.a.Function;
	});

	it('should have a type', function () {
		try {
			throw new AppcException;
		} catch (ex) {
			ex.should.have.property('type');
			ex.type.should.equal('AppcException');
		}
	});

	it('should have an empty message', function () {
		try {
			throw new AppcException;
		} catch (ex) {
			ex.should.have.property('type');
			ex.type.should.equal('AppcException');
			ex.should.have.property('message');
			ex.message.should.equal('');
			ex.should.have.property('details');
			ex.details.should.eql([]);
		}
	});

	it('should have a message', function () {
		try {
			throw new AppcException('whoops');
		} catch (ex) {
			ex.should.have.property('type');
			ex.type.should.equal('AppcException');
			ex.should.have.property('message');
			ex.message.should.equal('whoops');
			ex.should.have.property('details');
			ex.details.should.eql([]);
		}
	});

	it('should have a message and some error details', function () {
		try {
			throw new AppcException('whoops', [ 'detail 1', 'detail 2' ]);
		} catch (ex) {
			ex.should.have.property('type');
			ex.type.should.equal('AppcException');
			ex.should.have.property('message');
			ex.message.should.equal('whoops');
			ex.should.have.property('details');
			ex.details.should.eql([ 'detail 1', 'detail 2' ]);
		}
	});

	it('#log()', function () {
		try {
			var err = new AppcException('whoops');
			err.log('detail 1');
			err.log('detail 2');
			throw err;
		} catch (ex) {
			ex.should.have.property('type');
			ex.type.should.equal('AppcException');
			ex.should.have.property('message');
			ex.message.should.equal('whoops');
			ex.should.have.property('details');
			ex.details.should.eql([ 'detail 1', 'detail 2' ]);
		}
	});

	it('#dump() with function', function () {
		try {
			throw new AppcException('whoops', [ 'detail 1', 'detail 2' ]);
		} catch (ex) {
			var buffer = '';
			function logger(s) {
				buffer += s + '\n';
			}
			ex.dump(logger);
			buffer.should.equal('whoops\ndetail 1\ndetail 2\n');
		}
	});

	it('#dump() with object', function () {
		try {
			throw new AppcException('whoops', [ 'detail 1', 'detail 2' ]);
		} catch (ex) {
			var buffer = '';
			function logger(s) {
				buffer += s + '\n';
			}
			ex.dump({
				log: logger,
				error: logger
			});
			buffer.should.equal('whoops\ndetail 1\ndetail 2\n');
		}
	});

	it('#dump() with object.log()', function () {
		try {
			throw new AppcException('whoops', [ 'detail 1', 'detail 2' ]);
		} catch (ex) {
			var buffer = '';
			function logger(s) {
				buffer += s + '\n';
			}
			ex.dump({
				log: logger
			});
			buffer.should.equal('whoops\ndetail 1\ndetail 2\n');
		}
	});

	it('#dump() with object.error()', function () {
		try {
			throw new AppcException('whoops', [ 'detail 1', 'detail 2' ]);
		} catch (ex) {
			var buffer = '';
			function logger(s) {
				buffer += s + '\n';
			}
			ex.dump({
				error: logger
			});
			buffer.should.equal('whoops\ndetail 1\ndetail 2\n');
		}
	});

	it('#dump() with bad object', function () {
		try {
			throw new AppcException('whoops', [ 'detail 1', 'detail 2' ]);
		} catch (ex) {
			(function () {
				ex.dump({});
			}).should.throw();
		}
	});

	it('#toString()', function () {
		try {
			throw new AppcException('whoops', [ 'detail 1', 'detail 2' ]);
		} catch (ex) {
			ex.toString().should.equal('whoops\ndetail 1\ndetail 2');
		}
	});
});
