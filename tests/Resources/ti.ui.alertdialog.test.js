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

describe('Titanium.UI.AlertDialog', () => {
	it('.apiName', () => {
		const dialog = Ti.UI.createAlertDialog();
		should(dialog).have.readOnlyProperty('apiName').which.is.a.String();
		should(dialog.apiName).be.eql('Ti.UI.AlertDialog');
	});

	describe('.title', () => {
		it('is a String', () => {
			const bar = Ti.UI.createAlertDialog({
				title: 'this is some text'
			});
			should(bar.title).be.a.String();
			should(bar.title).eql('this is some text');
			bar.title = 'other text';
			should(bar.title).eql('other text');
		});

		it('has no accessors', () => {
			const bar = Ti.UI.createAlertDialog({
				title: 'this is some text'
			});
			should(bar).not.have.accessors('title');
		});
	});

	describe('.titleid', () => {
		// FIXME titleid doesn't seem to set title on iOS?
		it.iosBroken('is a String', () => {
			const bar = Ti.UI.createAlertDialog({
				titleid: 'this_is_my_key'
			});
			should(bar.titleid).be.a.String();
			should(bar.titleid).eql('this_is_my_key');
			should(bar.title).eql('this is my value'); // fails on iOS, gives undefined
			bar.titleid = 'other text';
			should(bar.titleid).eql('other text');
			should(bar.title).eql('this is my value'); // retains old value if key not found: https://jira-archive.titaniumsdk.com/TIMOB-23498
		});

		it('has no accessors', () => {
			const bar = Ti.UI.createAlertDialog({
				title: 'this is some text'
			});
			should(bar).not.have.accessors('titleid');
		});
	});

	describe('.message', () => {
		it('is a String', () => {
			const bar = Ti.UI.createAlertDialog({
				message: 'this is some text'
			});
			should(bar.message).be.a.String();
			should(bar.message).eql('this is some text');
			bar.message = 'other text';
			should(bar.message).eql('other text');
		});

		it('has no accessors', () => {
			const bar = Ti.UI.createAlertDialog({
				message: 'this is some text'
			});
			should(bar).not.have.accessors('message');
		});
	});

	describe('.buttonNames', () => {
		// FIXME Get working on iOS - defaults to undefined, should be ['OK']
		// FIXME Get working on Android - defaults to undefined, should be ['OK']
		it.androidAndIosBroken('is a string[]', () => {
			const bar = Ti.UI.createAlertDialog({});
			should(bar.buttonNames).be.an.Array(); // undefined on iOS and Android
			should(bar.buttonNames).be.empty();
			bar.buttonNames = [ 'this', 'other' ];
			should(bar.buttonNames.length).eql(2);
		});

		it('has no accessors', () => {
			const bar = Ti.UI.createAlertDialog({});
			should(bar).not.have.accessors('buttonNames');
		});
	});

	describe('.cancel', () => {
		// FIXME Get working on iOS - defaults to undefined, should be -1
		// FIXME Get working on Android - defaults to undefined, should be -1
		it.androidAndIosBroken('is a Number', () => {
			const bar = Ti.UI.createAlertDialog({});
			should(bar.cancel).be.a.Number(); // undefined on iOS and Android
			bar.cancel = 1;
			should(bar.cancel).eql(1);
		});

		it('has no accessors', () => {
			const bar = Ti.UI.createAlertDialog({});
			should(bar).not.have.accessors('cancel');
		});
	});

	describe.ios('.tintColor', () => {
		it('accepts a String color', () => {
			const bar = Ti.UI.createAlertDialog({
				tintColor: 'red'
			});

			should(bar.tintColor).be.a.String();
			should(bar.tintColor).eql('red');

			bar.tintColor = '#f00';

			should(bar.tintColor).eql('#f00');
		});

		it('has no accessors', () => {
			const bar = Ti.UI.createAlertDialog({
				tintColor: 'red'
			});
			should(bar).not.have.accessors('tintColor');
		});
	});
});
