/*
 * run.js: Titanium iOS CLI run hook
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var appc = require('node-appc'),
	parallel = require('async').parallel,
	exec = require('child_process').exec;

exports.init = function (logger, config, cli) {
	
	cli.addHook('postbuild', {
		priority: 10000,
		post: function (data, finished) {
			if (cli.argv.target != 'simulator') return finished();
			
			if (cli.argv['build-only']) {
				logger.info('Performed build only, skipping running of the application');
			} else {
				logger.info('Running application in iOS Simulator');
				
				parallel([
					function (next) {
						exec('/usr/bin/killall ios-sim', next);
					},
					
					function (next) {
						exec('/usr/bin/killall "iPhone Simulator"', next);
					}
				], function () {
					finished();
				});
			}
		}
	});
	
};
