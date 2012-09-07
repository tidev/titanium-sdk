/*
 * run.js: Titanium Mobile CLI run command
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var appc = require('node-appc'),
	lib = require('./lib/common');

exports.config = function (logger, config, cli) {
	return {
		desc: __('install and run an app'),
		platforms: lib.platformOptions()
	};
};

exports.validate = function (logger, config, cli) {
};

exports.run = function (logger, config, cli) {
};
