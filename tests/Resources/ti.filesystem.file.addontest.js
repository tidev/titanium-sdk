/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2019-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');

describe('Ti.Filesystem', () => {
	it.android('TIMOB-27193', () => {
		const filename = `TIMOB-27193_${Date.now()}.txt`;
		const file = Ti.Filesystem.getFile(Ti.Filesystem.tempDirectory, filename);
		const originalPath = file.nativePath;
		file.createFile();
		should(file.exists()).eql(true);
		// make sure we're not getting swindled by having the underlying file inside the proxy get changed on us!
		should(file.nativePath).eql(originalPath);
	});
});
