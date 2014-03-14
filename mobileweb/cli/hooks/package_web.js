/**
 * Packages web specific resources for Titanium Mobile Web apps.
 *
 * @copyright
 * Copyright (c) 2014 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var appc = require('node-appc'),
	async = require('async'),
	ejs = require('ejs'),
	fs = require('fs'),
	path = require('path'),
	spawn = require('child_process').spawn,
	uuid = require('node-uuid'),
	windows = require('titanium-sdk/lib/windows'),
	wrench = require('wrench'),
	__ = appc.i18n(__dirname).__;

exports.cliVersion = '>=3.X';

exports.init = function (logger, config, cli) {
};