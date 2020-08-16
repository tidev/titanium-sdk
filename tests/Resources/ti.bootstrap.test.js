/*
 * Axway Appcelerator Titanium Mobile
 * Copyright (c) 2011-2018 by Axway Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe.windowsMissing('Titanium.Bootstrap', function () {
	// Determine if "bootstraps/simple.bootstrap.js" was auto-loaded on startup.
	it('simple.bootstrap', function () {
		should(global.wasSimpleBootstrapLoaded).be.be.true();
	});

	// Determine if "bootstraps/ui.bootstrap.js" was auto-loaded on startup.
	it('ui.bootstrap', function () {
		should(global.wasUIBootstrapLoaded).be.be.true();
		should(global.wasUIBootstrapExecuted).be.be.true();
	});
});
