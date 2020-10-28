/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020-Present by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint no-undef: "off" */
'use strict';

const should = require('./utilities/assertions');

describe('Titanium.UI.Clipboard', () => {

	describe('properties', () => {
		describe('.apiName', () => {
			it('is a String', () => {
				should(Ti.UI.Clipboard).have.a.readOnlyProperty('apiName').which.is.a.String();
			});

			it('equals Ti.UI.Clipboard', () => {
				should(Ti.UI.Clipboard.apiName).eql('Ti.UI.Clipboard');
			});
		});

		describe.ios('.name', () => {
			it('is a String', () => {
				should(Ti.UI.Clipboard).have.a.property('name').which.is.a.String();
			});
		});

		describe.ios('.unique', () => {
			it('is a Boolean', () => {
				should(Ti.UI.Clipboard).have.a.property('unique').which.is.a.Boolean();
			});
		});
	});

	describe('methods', () => {
		describe('#clearData', () => {
			it('is a Function', () => { // eslint-disable-line mocha/no-identical-title
				should(Ti.UI.Clipboard.clearData).be.a.Function();
			});
		});

		describe('#clearText', () => {
			it('is a Function', () => { // eslint-disable-line mocha/no-identical-title
				should(Ti.UI.Clipboard.clearText).be.a.Function();
			});
		});

		describe('#getData', () => {
			it('is a Function', () => { // eslint-disable-line mocha/no-identical-title
				should(Ti.UI.Clipboard.getData).be.a.Function();
			});
		});

		describe.ios('#getItems', () => {
			it('is a Function', () => { // eslint-disable-line mocha/no-identical-title
				should(Ti.UI.Clipboard.getItems).be.a.Function();
			});
		});

		describe('#getText', () => {
			it('is a Function', () => { // eslint-disable-line mocha/no-identical-title
				should(Ti.UI.Clipboard.getText).be.a.Function();
			});
		});

		describe.ios('#hasColors', () => {
			it('is a Function', () => { // eslint-disable-line mocha/no-identical-title
				should(Ti.UI.Clipboard.hasColors).be.a.Function();
			});
		});

		describe('#hasData', () => {
			it('is a Function', () => { // eslint-disable-line mocha/no-identical-title
				should(Ti.UI.Clipboard.hasData).be.a.Function();
			});
		});

		describe.ios('#hasImages', () => {
			it('is a Function', () => { // eslint-disable-line mocha/no-identical-title
				should(Ti.UI.Clipboard.hasImages).be.a.Function();
			});
		});

		describe('#hasText', () => {
			it('is a Function', () => { // eslint-disable-line mocha/no-identical-title
				should(Ti.UI.Clipboard.hasText).be.a.Function();
			});
		});

		describe.ios('#hasURLs', () => {
			it('is a Function', () => { // eslint-disable-line mocha/no-identical-title
				should(Ti.UI.Clipboard.hasURLs).be.a.Function();
			});
		});

		describe.ios('#remove', () => {
			it('is a Function', () => { // eslint-disable-line mocha/no-identical-title
				should(Ti.UI.Clipboard.remove).be.a.Function();
			});
		});

		describe('#setData', () => {
			it('is a Function', () => { // eslint-disable-line mocha/no-identical-title
				should(Ti.UI.Clipboard.setData).be.a.Function();
			});
		});

		describe.ios('#setItems', () => {
			it('is a Function', () => { // eslint-disable-line mocha/no-identical-title
				should(Ti.UI.Clipboard.setItems).be.a.Function();
			});
		});

		describe('#setText', () => {
			it('is a Function', () => { // eslint-disable-line mocha/no-identical-title
				should(Ti.UI.Clipboard.setText).be.a.Function();
			});
		});
	});

	describe('examples', () => {
		it('Copy Text to the Clipboard', () => {
			Ti.UI.Clipboard.clearText();
			// returns empty string on Android and undefined on iOS
			if (OS_ANDROID) {
				should(Ti.UI.Clipboard.getText()).eql('');
			} else {
				should.not.exist(Ti.UI.Clipboard.getText());
			}
			Ti.UI.Clipboard.setText('hello');
			should(Ti.UI.Clipboard.hasText()).be.true();
			should(Ti.UI.Clipboard.getText()).eql('hello');
		});

		it.ios('Use of named clipboard in iOS', () => {
			const clipboard1 = Ti.UI.createClipboard({
				name: 'myClipboard',
				allowCreation: true
			});
			should(clipboard1.name).eql('myClipboard');
			clipboard1.setText('hello');
			should(clipboard1.getText()).eql('hello');

			const clipboard2 = Ti.UI.createClipboard({
				name: 'myClipboard'
			});

			should(clipboard2.getText()).eql('hello'); // same name, so shares the same text
		});

		it.ios('Use of unique named clipboard in iOS', () => {
			const clipboard = Ti.UI.createClipboard({
				unique: true
			});
			clipboard.setText('hello');

			// Uses a GUID for name
			should(clipboard.name).match(/[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}/);
			should(clipboard.unique).be.true();
			should(clipboard.getText()).eql('hello');
		});
	});

});
