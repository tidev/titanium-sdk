import { codes } from './errors';

let error;
function lazyError() {
	if (!error) {
		// @fixme rollup cannot handle lazy loaded modules, maybe move to webpack?
		// error = require('./errors').codes.ERR_INTERNAL_ASSERTION;
		error = codes.ERR_INTERNAL_ASSERTION;
	}
	return error;
}
function assert(value, message) {
	if (!value) {
		const ERR_INTERNAL_ASSERTION = lazyError();
		throw new ERR_INTERNAL_ASSERTION(message);
	}
}

function fail(message) {
	const ERR_INTERNAL_ASSERTION = lazyError();
	throw new ERR_INTERNAL_ASSERTION(message);
}

assert.fail = fail;

export default assert;
