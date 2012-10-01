/*
 * plugins.js: Titanium CLI plugins hook
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var ti = require('titanium-sdk');

exports.init = function (logger, config, cli) {
	var gPlugins;
	
	function fire(evtName, data, callback) {
		if (gPlugins) {
			// TODO: need to run all plugins via async series to fire the evtName
			// for now, just call the callback
			data.logger && data.logger.debug('Would be firing "' + evtName + '" legacy plugin hook if it was supported');
			callback();
		} else {
			callback();
		}
	}
	
	cli.addHook('prebuild', function (data, finished) {
		var build = data.build || {},
			tiapp = build.tiapp,
			logger = build.logger;
		
		if (tiapp && tiapp.plugins) {
			ti.plugin.find(tiapp.plugins, data.build.projectDir, logger, function (plugins) {
				gPlugins = plugins;
				
				if (plugins.missing.length) {
					logger.error(__('Could not find all required Titanium plugins:'))
					plugins.missing.forEach(function (m) {
						logger.error('   id: ' + m.id + '\t version: ' + m.version);
					});
					logger.log();
					process.exit(1);
				}
				
				fire('compile', data, finished);
			});
		} else {
			finished();
		}
	});
	
	cli.addHook('postbuild', function (data, finished) {
		fire('postbuild', data, finished);
	});
	
	cli.addHook('finalize', function (data, finished) {
		fire('finalize', data, finished);
	});
	
};
