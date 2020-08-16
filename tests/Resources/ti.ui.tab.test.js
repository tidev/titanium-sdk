/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';

require('ti-mocha');
var should = require('./utilities/assertions');

describe('Titanium.UI.Tab', function () {
	it('apiName', function () {
		var tab = Ti.UI.createTab({
			text: 'this is some text'
		});
		should(tab).have.readOnlyProperty('apiName').which.is.a.String();
		should(tab.apiName).be.eql('Ti.UI.Tab');
	});

	it('title', function () {
		var tab = Ti.UI.createTab({
			title: 'this is some text'
		});
		should(tab.title).be.a.String();
		should(tab.getTitle).be.a.Function();
		should(tab.title).eql('this is some text');
		should(tab.getTitle()).eql('this is some text');
		tab.title = 'other text';
		should(tab.title).eql('other text');
		should(tab.getTitle()).eql('other text');
	});

	it('titleid', function () {
		var bar = Ti.UI.createTab({
			titleid: 'this_is_my_key'
		});
		should(bar.titleid).be.a.String();
		should(bar.getTitleid).be.a.Function();
		should(bar.titleid).eql('this_is_my_key');
		should(bar.getTitleid()).eql('this_is_my_key');
		should(bar.title).eql('this is my value');
		bar.titleid = 'other text';
		should(bar.titleid).eql('other text');
		should(bar.getTitleid()).eql('other text');
		should(bar.title).eql('this is my value'); // FIXME Windows: https://jira.appcelerator.org/browse/TIMOB-23498
	});

	it('.titleColor', () => {
		const tab = Ti.UI.createTab({
			titleColor: 'red'
		});

		should(tab.titleColor).be.a.String();
		should(tab.titleColor).eql('red');
	});

	it('.activeTitleColor', () => {
		const tab = Ti.UI.createTab({
			activeTitleColor: 'red'
		});

		should(tab.activeTitleColor).be.a.String();
		should(tab.activeTitleColor).eql('red');
	});

	it('.tintColor', () => {
		const tab = Ti.UI.createTab({
			tintColor: 'red'
		});

		should(tab.tintColor).be.a.String();
		should(tab.tintColor).eql('red');
	});

	it('.activeTintColor', () => {
		const tab = Ti.UI.createTab({
			activeTintColor: 'red'
		});

		should(tab.activeTintColor).be.a.String();
		should(tab.activeTintColor).eql('red');
	});
});
