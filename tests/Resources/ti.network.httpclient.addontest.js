/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2019 Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Titanium.Network.HTTPClient', function () {
	this.timeout(6e4);

	it.android('TLSv3 support', function (finish) {
		// Only supported on Android 10+
		if (parseInt(Ti.Platform.version.split('.')[0]) < 10) {
			return finish();
		}

		const client = Ti.Network.createHTTPClient({
			onload: e => {
				const html = e.source.responseText;
				if (html.includes('protocol_tls1_3">Yes')) {
					finish();
				}
			},
			onerror:
          e => { finish(new Error('Could not determine TLSv3 support.')); },
			timeout: 8000
		});
		client.open('GET', 'https://ssllabs.com/ssltest/viewMyClient.html');
		client.send();
	});
});
