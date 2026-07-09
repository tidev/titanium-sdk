/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');

describe('Titanium.UI.Toolbar', function () {
	this.timeout(10000);

	// FIXME Add to Windows API!
	it.windowsMissing('SimpleToolbar', function () {
		const send = Ti.UI.createButton({
				title: 'Send',
			}),
			camera = Ti.UI.createButton({
				title: 'Camera'
			}),
			toolbar = Ti.UI.createToolbar({
				items: [ send, camera ],
				bottom: 0
			});

		should(toolbar).have.readOnlyProperty('apiName').which.is.a.String();
		should(toolbar.apiName).be.eql('Ti.UI.Toolbar');
		should(toolbar.items).be.an.Array();
		should(toolbar.items.length).eql(2);
	});
});
