'use strict';

const should = require('./utilities/assertions');

describe('buffer', () => {
	it('supports array index access', () => {
		const buf = Buffer.alloc(4);
		should(buf.length).eql(4);
		should(buf).eql(Buffer.from([ 0, 0, 0, 0 ]));
		const values = [ 0, 1, 2, 3 ];
		for (let i = 0; i < values.length; i++) {
			buf[i] = values[i];
			should(buf[i]).eql(values[i]);
		}
		should(buf).eql(Buffer.from(values));
	});
});
