/*
 * run.js: Titanium iOS CLI run command
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var appc = require('node-appc'),
	afs = appc.fs,
	parallel = appc.async.parallel,
	exec = require('child_process').exec;

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
	
	parallel([
		function (next) {
			exec('/usr/bin/killall ios-sim', next);
		},
		
		function (next) {
			exec('/usr/bin/killall "iPhone Simulator"', next);
		}
	], function () {
		finished && finished();
	});
}

run.prototype = {

	//

};