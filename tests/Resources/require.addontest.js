/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2019-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');

describe('require', function () {
	it('should handle directory with package.json main pointing at directory with index.js', function () {
		const result = require('./package_with_main_dir');
		should(result).have.property('success');
		should(result.success).eql(true);
	});
});
