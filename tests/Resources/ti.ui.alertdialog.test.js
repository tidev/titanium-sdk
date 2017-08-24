/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
var should = require('./utilities/assertions'),
	utilities = require('./utilities/utilities');

describe('Titanium.UI.AlertDialog', function () {
	it('apiName', function () {
		var dialog = Ti.UI.createAlertDialog();
		should(dialog).have.readOnlyProperty('apiName').which.is.a.String;
		should(dialog.apiName).be.eql('Ti.UI.AlertDialog');
	});

	it('title', function () {
		var bar = Ti.UI.createAlertDialog({
			title: 'this is some text'
		});
		should(bar.title).be.a.String;
		should(bar.getTitle).be.a.Function;
		should(bar.title).eql('this is some text');
		should(bar.getTitle()).eql('this is some text');
		bar.title = 'other text';
		should(bar.title).eql('other text');
		should(bar.getTitle()).eql('other text');
	});

	// FIXME titleid doesn't seem to set title on iOS?
	(utilities.isIOS() ? it.skip : it)('titleid', function () {
		var bar = Ti.UI.createAlertDialog({
			titleid: 'this_is_my_key'
		});
		should(bar.titleid).be.a.String;
		should(bar.getTitleid).be.a.Function;
		should(bar.titleid).eql('this_is_my_key');
		should(bar.getTitleid()).eql('this_is_my_key');
		should(bar.title).eql('this is my value'); // fails on iOS, gives undefined
		bar.titleid = 'other text';
		should(bar.titleid).eql('other text');
		should(bar.getTitleid()).eql('other text');
		should(bar.title).eql('this is my value'); // retains old value if key not found: https://jira.appcelerator.org/browse/TIMOB-23498
	});

	it('message', function () {
		var bar = Ti.UI.createAlertDialog({
			message: 'this is some text'
		});
		should(bar.message).be.a.String;
		should(bar.getMessage).be.a.Function;
		should(bar.message).eql('this is some text');
		should(bar.getMessage()).eql('this is some text');
		bar.message = 'other text';
		should(bar.message).eql('other text');
		should(bar.getMessage()).eql('other text');
	});

	// FIXME Get working on iOS - defaults to undefined, should be ['OK']
	// FIXME Get working on Android - defaults to undefined, should be ['OK']
	((utilities.isIOS() || utilities.isAndroid()) ? it.skip : it)('buttonNames', function () {
		var bar = Ti.UI.createAlertDialog({});
		should(bar.buttonNames).be.an.Array; // undefined on iOS and Android
		should(bar.getButtonNames).be.a.Function;
		should(bar.buttonNames).be.empty;
		should(bar.getButtonNames()).be.empty;
		bar.buttonNames = ['this','other'];
		should(bar.buttonNames.length).eql(2);
		should(bar.getButtonNames().length).eql(2);
	});

	// FIXME Get working on iOS - defaults to undefined, should be -1
	// FIXME Get working on Android - defaults to undefined, should be -1
	((utilities.isIOS() || utilities.isAndroid()) ? it.skip : it)('cancel', function (finish) {
		var bar = Ti.UI.createAlertDialog({});
		should(bar.cancel).be.a.Number; // undefined on iOS and Android
		should(bar.getCancel).be.a.Function;
		bar.cancel = 1;
		should(bar.cancel).eql(1);
		should(bar.getCancel()).eql(1);
	});
	
	// Skip on other platforms, since it's an iOS-only property
	(utilities.isIOS() ? it : it.skip)('tintColor', function () {
		var bar = Ti.UI.createAlertDialog({
			tintColor: 'red'
		});
		
		// Check getter
		should(bar.tintColor).be.a.String;
		should(bar.getTintColor).be.a.Function;
		should(bar.tintColor).eql('red');
		should(bar.getTintColor()).eql('red');
		
		// Set new value
		bar.tintColor = '#f00';
		
		// Check getter again
		should(bar.tintColor).eql('#f00');
		should(bar.getTintColor()).eql('#f00');
		
		// Check setter
		should(bar.setTintColor).be.a.Function;
		bar.setTintColor('#0f0');
		should(bar.tintColor).eql('#0f0');
	});
});
