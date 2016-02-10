/**
 * node-appc - Appcelerator Common Library for Node.js
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var appc = require('../index'),
	path = require('path');

describe('xcconfig', function () {
	it('namespace exists', function () {
		appc.should.have.property('xcconfig');
		appc.xcconfig.should.be.a.Function;
	});

	it('should load and parse a xcconfig file', function () {
		var result = new appc.xcconfig(path.join(__dirname, 'resources', 'project.xcconfig'));
		result.should.be.an.Object;

		result.should.eql({
			TI_VERSION: '3.2.0',
			TI_SDK_DIR: '/Users/chris/Library/Application Support/Titanium/mobilesdk/osx/$(TI_VERSION)/iphone',
			TI_APPID: 'com.appcelerator.testapp2',
			'OTHER_LDFLAGS[sdk=iphoneos*]': '$(inherited) -weak_framework iAd',
			'OTHER_LDFLAGS[sdk=iphonesimulator*]': '$(inherited) -weak_framework iAd',
			'#include "module': '"'
		});
	});

	it('should fail to load non-existant xcconfig file', function () {
		(function () {
			new appc.xcconfig(path.join(__dirname, 'resources', 'does-not-exist.xcconfig'));
		}).should.throw();
	});
});
