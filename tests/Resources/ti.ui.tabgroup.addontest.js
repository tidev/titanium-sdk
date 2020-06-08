/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020-Present by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions'); // eslint-disable-line no-unused-vars

describe('Titanium.UI.TabGroup', function () {
	let tabGroup;

	this.timeout(5000);

	afterEach(function (done) {
		if (tabGroup) {
			// If `tabGroup` is already closed, we're done.
			let t = setTimeout(function () {
				if (tabGroup) {
					tabGroup = null;
					done();
				}
			}, 3000);

			tabGroup.addEventListener('close', function listener () {
				clearTimeout(t);

				if (tabGroup) {
					tabGroup.removeEventListener('close', listener);
				}
				tabGroup = null;
				done();
			});
			tabGroup.close();
		} else {
			tabGroup = null;
			done();
		}
	});

	it('.barColor', () => {
		tabGroup = Ti.UI.createTabGroup({
			title: 'TabGroup',
			barColor: 'red'
		});

		should(tabGroup.barColor).be.a.String;
		should(tabGroup.barColor).eql('red');
	});

	it('.tintColor', () => {
		tabGroup = Ti.UI.createTabGroup({
			title: 'TabGroup',
			tintColor: 'red'
		});

		should(tabGroup.tintColor).be.a.String;
		should(tabGroup.tintColor).eql('red');
	});

	it('.activeTintColor', () => {
		tabGroup = Ti.UI.createTabGroup({
			title: 'TabGroup',
			activeTintColor: 'red'
		});

		should(tabGroup.activeTintColor).be.a.String;
		should(tabGroup.activeTintColor).eql('red');
	});
});
