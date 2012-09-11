/*
 * run.js: Titanium Mobile Web CLI run command
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

exports.run = function (logger, config, cli, finished) {
	new run(logger, config, cli, finished);
};

function run(logger, config, cli, finished) {
	dump(cli.argv);
	
	finished && finished();
}

run.prototype = {

	//

};