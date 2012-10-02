/*
 * install.js: Titanium iOS CLI install hook
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

exports.init = function (logger, config, cli) {
	
	cli.addHook('postbuild', {
		priority: 8000,
		post: function (data, finished) {
			if (!/simulator|device/.test(cli.argv.target)) return finished();
			
			if (cli.argv['build-only']) {
				
				logger.info('Performed build only, skipping installing of the application');
				
			} else if (cli.argv.target == 'simulator') {
				
				logger.info('Installing application in the iOS Simulator');
				
			} else if (cli.argv.target == 'device') {
				
				logger.info('Installing application into iTunes');
				
			}
			
			finished();
		}
	});
	
};
