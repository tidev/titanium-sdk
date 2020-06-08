/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020-Present by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';

require('ti-mocha');
var should = require('./utilities/assertions');

describe('Titanium.UI.Tab', function () {
	it('.titleColor', () => {
		const tab = Ti.UI.createTab({
			titleColor: 'red'
		});

		should(tab.titleColor).be.a.String;
		should(tab.titleColor).eql('red');
	});

	it('.activeTitleColor', () => {
		const tab = Ti.UI.createTab({
			activeTitleColor: 'red'
		});

		should(tab.activeTitleColor).be.a.String;
		should(tab.activeTitleColor).eql('red');
	});

	it('.tintColor', () => {
		const tab = Ti.UI.createTab({
			tintColor: 'red'
		});

		should(tab.tintColor).be.a.String;
		should(tab.tintColor).eql('red');
	});

	it('.activeTintColor', () => {
		const tab = Ti.UI.createTab({
			activeTintColor: 'red'
		});

		should(tab.activeTintColor).be.a.String;
		should(tab.activeTintColor).eql('red');
	});
});
