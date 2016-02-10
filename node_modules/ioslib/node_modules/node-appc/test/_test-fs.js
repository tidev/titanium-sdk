var assert = require('assert'),
	appc = require('../lib/appc'), // needed for dump()
	fs = require('../lib/fs');

(function testResolvePath() {
	dump(fs.resolvePath('.'));
	dump(fs.resolvePath('..'));
	dump(fs.resolvePath('..', 'tests'));
	dump(fs.resolvePath('..', 'tests', 'test-fs.js'));
	dump(fs.resolvePath('~'));
	dump(fs.resolvePath('~', 'Desktop'));
	dump(fs.resolvePath('~', '..', 'appc'));
}());
