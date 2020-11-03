/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';

const should = require('./utilities/assertions');

describe('Titanium.UI.OptionDialog', function () {

	it('apiName', function () {
		const optionDialog = Ti.UI.createOptionDialog({
			title: 'this is some text'
		});
		should(optionDialog).have.readOnlyProperty('apiName').which.is.a.String();
		should(optionDialog.apiName).be.eql('Ti.UI.OptionDialog');
	});

	it('title', function () {
		const bar = Ti.UI.createOptionDialog({
			title: 'this is some text'
		});
		should(bar.title).be.a.String();
		should(bar.getTitle).be.a.Function();
		should(bar.title).eql('this is some text');
		should(bar.getTitle()).eql('this is some text');
		bar.title = 'other text';
		should(bar.title).eql('other text');
		should(bar.getTitle()).eql('other text');
	});

	// FIXME Get working on iOS. Looks like it doesn't look up titleid keys?!
	it.iosBroken('titleid', function () {
		const bar = Ti.UI.createOptionDialog({
			titleid: 'this_is_my_key'
		});
		should(bar.titleid).be.a.String();
		should(bar.getTitleid).be.a.Function();
		should(bar.titleid).eql('this_is_my_key');
		should(bar.getTitleid()).eql('this_is_my_key');
		should(bar.title).eql('this is my value'); // iOS returns undefined!
		bar.titleid = 'other text';
		should(bar.titleid).eql('other text');
		should(bar.getTitleid()).eql('other text');
		should(bar.title).eql('this is my value'); // FIXME Windows: https://jira.appcelerator.org/browse/TIMOB-23498
	});

	// Intentionally skip for iOS. buttonNames property isn't on iOS. TODO Add it for parity?
	// FIXME defaults to undefined on Android, empty array on Windows.
	it.androidBrokenAndIosMissing('buttonNames', function () {
		const bar = Ti.UI.createOptionDialog({});
		should(bar.buttonNames).be.an.Array(); // undefined on Android
		should(bar.getButtonNames).be.a.Function();
		should(bar.buttonNames).be.empty;
		should(bar.getButtonNames()).be.empty;
		bar.buttonNames = [ 'this', 'other' ];
		should(bar.buttonNames.length).eql(2);
		should(bar.getButtonNames().length).eql(2);
	});

	// FIXME Get working on iOS and Android. options is defaulting to undefined, where for Windows we do empty array
	it.androidAndIosBroken('options', function () {
		const bar = Ti.UI.createOptionDialog({});
		should(bar.options).be.an.Array(); // undefined on iOS and Android
		should(bar.getOptions).be.a.Function();
		should(bar.options).be.empty;
		should(bar.getOptions()).be.empty;
		bar.options = [ 'this', 'other' ];
		should(bar.options.length).eql(2);
		should(bar.getOptions().length).eql(2);
	});

	// FIXME Get working on iOS and Android. cancel is defaulting to undefined? Docs say should be -1
	it.androidAndIosBroken('cancel', function () {
		const bar = Ti.UI.createOptionDialog({});
		should(bar.cancel).be.a.Number(); // undefined on iOS and Android
		should(bar.getCancel).be.a.Function();
		bar.cancel = 1;
		should(bar.cancel).eql(1);
		should(bar.getCancel()).eql(1);
	});

	// FIXME Get working on iOS and Android. persistent is defaulting to undefined? Docs say should be true
	it.androidAndIosBroken('persistent', function () {
		const bar = Ti.UI.createOptionDialog({});
		should(bar.persistent).be.a.Boolean(); // undefined on iOS and Android
		should(bar.getPersistent).be.a.Function();
		should(bar.persistent).be.true();
		should(bar.getPersistent()).be.true();
		bar.persistent = false;
		should(bar.persistent).be.false();
		should(bar.getPersistent()).be.false();
	});

	// Intentionally skip. property not on iOS
	// FIXME Get working on Android, defaults to undefined on Android, Windows has Number
	it.androidBrokenAndIosMissing('selectedIndex', function () {
		const bar = Ti.UI.createOptionDialog({});
		should(bar.selectedIndex).be.a.Number(); // undefined on Android
		should(bar.getSelectedIndex).be.a.Function();
		should(bar.selectedIndex).eql(0);
		should(bar.getSelectedIndex()).eql(0);
		bar.selectedIndex = 1;
		should(bar.selectedIndex).eql(1);
		should(bar.getSelectedIndex()).eql(1);
	});
});
