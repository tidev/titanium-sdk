/**
 * @overview
 * Hook that performa Android specific functions when creating an Android module.
 *
 * @copyright
 * Copyright (c) 2014 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var fs = require('fs'),
	path = require('path');

exports.cliVersion = '>=3.2';

exports.init = function (logger, config, cli, appc) {
	cli.on('create.post.module', function (creator, callback) {
		var android = require('titanium-sdk/lib/android');
		android.detect(creator.config, null, function (results) {

			// do something with the results!

			callback();
		});
	});
};
