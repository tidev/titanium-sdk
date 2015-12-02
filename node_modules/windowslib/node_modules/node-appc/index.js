/**
 * node-appc - Appcelerator Common Library for Node.js
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

module.exports = process.env.APPC_COV && require('fs').existsSync(__dirname + '/lib-cov')
	? require(__dirname + '/lib-cov/appc')
	: require(__dirname + '/lib/appc');
