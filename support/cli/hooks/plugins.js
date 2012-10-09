/*
 * plugins.js: Titanium CLI plugins hook
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

exports.cliVersion = '>=3.X';

exports.init = function (logger, config, cli) {
	function fire(evtName, data, callback) {
		// TODO: need to run all plugins via async series to fire the evtName
		// for now, just call the callback
		data.logger && data.logger.debug('Would be firing "' + evtName + '" legacy plugin hook if it was supported');
		callback();
	}
	
	cli.addHook('build.pre.compile', function (data, finished) {
		fire('compile', data, finished);
	});
	
	cli.addHook('build.post.compile', function (data, finished) {
		fire('postbuild', data, finished);
	});
	
	cli.addHook('build.finalize', function (data, finished) {
		fire('finalize', data, finished);
	});
};
