/*
 * project.js: Titanium Mobile CLI project command
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var ti = require('titanium-sdk');

exports.config = function (logger, config, cli) {
	return {
		desc: __('get and set tiapp.xml settings'),
		options: ti.commonOptions(logger, config)
	};
};

exports.validate = function (logger, config, cli) {
};

exports.run = function (logger, config, cli) {
	dump(cli.argv);
};
