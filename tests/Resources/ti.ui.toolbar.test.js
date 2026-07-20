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

	it.androidMissing('hideSharedBackground', function () {
		const toolbar = Ti.UI.createToolbar({
			items: [ Ti.UI.createButton({ title: 'A' }), Ti.UI.createButton({ title: 'B' }) ],
			hideSharedBackground: true
		});

		should(toolbar.hideSharedBackground).be.eql(true);
	});

	it.androidMissing('hideSharedBackground per item', function () {
		const buttonA = Ti.UI.createButton({ title: 'A', hideSharedBackground: true });
		const buttonB = Ti.UI.createButton({ title: 'B' });
		const toolbar = Ti.UI.createToolbar({
			items: [ buttonA, buttonB ],
			bottom: 0
		});

		should(buttonA.hideSharedBackground).be.eql(true);
		should(buttonB.hideSharedBackground).not.be.eql(true);
		should(toolbar.items.length).eql(2);
	});
});
