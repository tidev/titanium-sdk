/*
 * install.js: Titanium Android CLI install hook
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

exports.cliVersion = '>=3.X';

exports.init = function (logger, config, cli) {
	
	cli.addHook('build.post.compile', {
		priority: 8000,
		post: function (data, finished) {
			finished();
		}
	});
	
};
