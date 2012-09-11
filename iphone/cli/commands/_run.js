/*
 * run.js: Titanium iOS CLI run command
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var appc = require('node-appc'),
	afs = appc.fs;

exports.config = function (logger, config, cli) {
	return {
		//
	};
};

exports.run = function (opts) {
	new build(opts);
};

function build(opts) {
	dump(opts.cli.argv);
	
	opts.finished();
}

build.prototype = {

	//

};