/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Titanium.Network', function () {

	// Constants
	var NETWORK_TYPES = [ 'NETWORK_LAN', 'NETWORK_MOBILE', 'NETWORK_NONE', 'NETWORK_UNKNOWN', 'NETWORK_WIFI' ],
		NOTIFICATION_TYPES = [ 'NOTIFICATION_TYPE_ALERT', 'NOTIFICATION_TYPE_BADGE', 'NOTIFICATION_TYPE_NEWSSTAND', 'NOTIFICATION_TYPE_SOUND' ],
		TLS_VERSIONS = [ 'TLS_VERSION_1_0', 'TLS_VERSION_1_1', 'TLS_VERSION_1_2', 'TLS_VERSION_1_3' ],
		i;
	// TODO Test that each group has unique values!
	for (i = 0; i < NETWORK_TYPES.length; i++) {
		it(NETWORK_TYPES[i], function () { // eslint-disable-line no-loop-func
			should(Ti.Network).have.constant(NETWORK_TYPES[i]).which.is.a.Number;
		});
	}
	for (i = 0; i < NOTIFICATION_TYPES.length; i++) {
		// iOS-specific properties
		it.ios(NOTIFICATION_TYPES[i], function () { // eslint-disable-line no-loop-func
			should(Ti.Network).have.constant(NOTIFICATION_TYPES[i]).which.is.a.Number;
		});
	}
	for (i = 0; i < TLS_VERSIONS.length; i++) {
		// FIXME Fails on Android and iOS for some reason! They say they're undefined, not Number
		// FIXME Windows fails to find the property up the prototype chain in utilities/assertions, line 33
		it.allBroken(TLS_VERSIONS[i], function () { // eslint-disable-line no-loop-func
			should(Ti.Network).have.constant(TLS_VERSIONS[i]).which.is.a.Number;
		});
	}

	it('PROGRESS_UNKNOWN', function () {
		should(Ti.Network).have.constant('PROGRESS_UNKNOWN').which.is.a.Number;
	});

	// Properties
	it('apiName', function () {
		should(Ti.Network).have.a.readOnlyProperty('apiName').which.is.a.String;
		should(Ti.Network.apiName).be.eql('Ti.Network');
	});

	it('networkType', function () {
		should(Ti.Network).have.a.readOnlyProperty('networkType').which.is.a.Number;
		// Has to be one of the defined constants
		should([ Ti.Network.NETWORK_LAN,
			Ti.Network.NETWORK_MOBILE,
			Ti.Network.NETWORK_NONE,
			Ti.Network.NETWORK_UNKNOWN,
			Ti.Network.NETWORK_WIFI ].indexOf(Ti.Network.networkType)).not.eql(-1);
	});

	it('networkTypeName', function () {
		should(Ti.Network).have.a.readOnlyProperty('networkTypeName').which.is.a.String;
		if (Ti.Network.networkType == Ti.Network.NETWORK_LAN) { // eslint-disable-line eqeqeq
			Ti.Network.networkTypeName.should.eql('LAN');
		} else if (Ti.Network.networkType == Ti.Network.NETWORK_MOBILE) { // eslint-disable-line eqeqeq
			Ti.Network.networkTypeName.should.eql('MOBILE');
		} else if (Ti.Network.networkType == Ti.Network.NETWORK_NONE) { // eslint-disable-line eqeqeq
			Ti.Network.networkTypeName.should.eql('NONE');
		} else if (Ti.Network.networkType == Ti.Network.NETWORK_UNKNOWN) { // eslint-disable-line eqeqeq
			Ti.Network.networkTypeName.should.eql('UNKNOWN');
		} else if (Ti.Network.networkType == Ti.Network.NETWORK_WIFI) { // eslint-disable-line eqeqeq
			Ti.Network.networkTypeName.should.eql('WIFI');
		}
	});

	it('online', function () {
		should(Ti.Network).have.a.readOnlyProperty('online').which.is.a.Boolean;
	});

	// Methods
	// These seem to "intermittently" be unefined on Windows!
	it.windowsBroken('encodeURIComponent()', function () {
		var text;
		should(Ti.Network.encodeURIComponent).be.a.Function;
		text = Ti.Network.encodeURIComponent('Look what I found! I like this:');
		text.should.eql('Look%20what%20I%20found!%20I%20like%20this%3A');
	});

	it.windowsBroken('decodeURIComponent()', function () {
		var text;
		should(Ti.Network.decodeURIComponent).be.a.Function;
		text = Ti.Network.decodeURIComponent('Look%20what%20I%20found!%20I%20like%20this%3A');
		text.should.eql('Look what I found! I like this:');
	});

	it('createHTTPClient()', function () {
		should(Ti.Network.createHTTPClient).be.a.Function;
	});
});
