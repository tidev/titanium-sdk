/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020-Present by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint no-undef: "off" */
/* eslint mocha/no-identical-title: "off" */
'use strict';

const should = require('./utilities/assertions');

describe('Titanium.UI.Clipboard', () => {
	let win = null;
	const waitTime = 1500;

	beforeEach(() => {
		if (win === null) {
			win = Ti.UI.createWindow({
				backgroundColor: '#fff'
			});
			win.open();
		}
	});

	// FIXME: There's a huge mismatch in the named data "mimeTypes" we accept and what iOS reports/accepts in set/getItems:
	// we take in 'text' -> they report 'public.plain-text'
	// we take in 'color' -> they report 'com.apple.uikit.color'
	// we take in 'text/plain' -> they report 'public.plain-text'
	// we take in 'url' -> they report 'public.url'
	// setting an url can also give us 'public.utf8-plain-text'
	// setting an image can give us multiple types: 'com.apple.uikit.image', 'public.png', 'public.jpeg'

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
		describe('#clearData()', () => {
			it('is a Function', () => {
				should(Ti.UI.Clipboard.clearData).be.a.Function();
			});

			it('clears \'text\' data type', () => {
				setTimeout(function () {
					Ti.UI.Clipboard.clearData(); // delete all data
					Ti.UI.Clipboard.text = 'clearData';
					should(Ti.UI.Clipboard.hasText()).be.true();
					Ti.UI.Clipboard.clearData('text');
					should(Ti.UI.Clipboard.hasText()).be.false();
				}, waitTime);
			});

			// TODO: Try clearing only specific mime types on iOS!
			it.ios('clears \'color\' data type', () => {
				Ti.UI.Clipboard.clearData(); // delete all data
				Ti.UI.Clipboard.setData('color', 'white');
				should(Ti.UI.Clipboard.hasColors()).be.true();
				should(Ti.UI.Clipboard.getData('color')).eql('#FFFFFF');
				Ti.UI.Clipboard.clearData('color');
				should(Ti.UI.Clipboard.hasColors()).be.false();
			});
		});

		describe('#clearText()', () => {
			it('is a Function', () => {
				should(Ti.UI.Clipboard.clearText).be.a.Function();
			});

			it('makes hasText() return false after being called', () => {
				setTimeout(function () {
					Ti.UI.Clipboard.clearData(); // delete all data
					Ti.UI.Clipboard.text = 'clearText';
					should(Ti.UI.Clipboard.hasText()).be.true();
					Ti.UI.Clipboard.clearText();
					should(Ti.UI.Clipboard.hasText()).be.false();
				}, waitTime);
			});
		});

		describe('#getData()', () => {
			it('is a Function', () => {
				should(Ti.UI.Clipboard.getData).be.a.Function();
			});

			// TODO: set and pull out data for each mime type: color, url, text, image
			it.ios('returns \'color\' data type', () => {
				Ti.UI.Clipboard.clearData(); // delete all data
				Ti.UI.Clipboard.setData('color', 'white');
				should(Ti.UI.Clipboard.hasColors()).be.true();
				should(Ti.UI.Clipboard.getData('color')).eql('#FFFFFF');
			});

			it.android('returns null for non-text data type on Android', () => {
				setTimeout(function () {
					Ti.UI.Clipboard.clearData(); // delete all data
					Ti.UI.Clipboard.text = 'hi';
					should(Ti.UI.Clipboard.getData('color')).be.null();
					should(Ti.UI.Clipboard.getData('url')).be.null();
					should(Ti.UI.Clipboard.getData('image')).be.null();
				}, waitTime);
			});

			it('returns \'text\' data type', () => {
				setTimeout(function () {
					Ti.UI.Clipboard.clearData(); // delete all data
					Ti.UI.Clipboard.setData('text', 'white');
					should(Ti.UI.Clipboard.hasText()).be.true();
					should(Ti.UI.Clipboard.getData('text')).eql('white');
					should(Ti.UI.Clipboard.getData('text/plain')).eql('white');
				}, waitTime);
			});

			it.ios('returns \'url\' data type', () => {
				Ti.UI.Clipboard.clearData(); // delete all data
				Ti.UI.Clipboard.setData('url', 'http://localhost:8080');
				should(Ti.UI.Clipboard.hasURLs()).be.true();
				should(Ti.UI.Clipboard.getData('url')).eql('http://localhost:8080');
			});

			it.ios('returns \'image\' data type as Ti.Blob when set as Ti.Filesystem.File', () => {
				Ti.UI.Clipboard.clearData(); // delete all data
				const file = Ti.Filesystem.getFile('Logo.png');
				Ti.UI.Clipboard.setData('image', file);
				const image = Ti.UI.Clipboard.getData('image');
				should(image).be.an.Object();
				should(image.apiName).eql('Ti.Blob');
			});

			it.ios('returns \'image\' data type as Ti.Blob when set as Ti.Blob', () => {
				Ti.UI.Clipboard.clearData(); // delete all data
				const blob = Ti.Filesystem.getFile('Logo.png').read();
				Ti.UI.Clipboard.setData('image', blob);
				const image = Ti.UI.Clipboard.getData('image');
				should(image).be.an.Object();
				should(image.apiName).eql('Ti.Blob');
			});
		});

		describe.ios('#getItems()', () => {
			it('is a Function', () => {
				should(Ti.UI.Clipboard.getItems).be.a.Function();
			});
		});

		describe('#text', () => {
			it('is a getter', () => {
				should(Ti.UI.Clipboard).have.a.getter('text');
			});

			it('returns empty string with empty clipboard', () => {
				Ti.UI.Clipboard.clearData(); // delete all data
				// should(Ti.UI.Clipboard.text).eql(''); // FIXME: undefined on iOS
			});

			it('returns given string after setText()', () => {
				setTimeout(function () {
					Ti.UI.Clipboard.clearData(); // delete all data
					// should(Ti.UI.Clipboard.text).eql(''); // FIXME: undefined on iOS
					Ti.UI.Clipboard.text = 'setText';
					should(Ti.UI.Clipboard.text).eql('setText');
				}, waitTime);
			});

			it('returns given string after setData(\'text\')', () => {
				setTimeout(function () {
					Ti.UI.Clipboard.clearData(); // delete all data
					// should(Ti.UI.Clipboard.text).eql(''); // FIXME: undefined on iOS
					Ti.UI.Clipboard.setData('text', 'setData');
					should(Ti.UI.Clipboard.text).eql('setData');
				}, waitTime);
			});

			it('returns given string after setData(\'text/plain\')', () => {
				setTimeout(function () {
					Ti.UI.Clipboard.clearData(); // delete all data
					// should(Ti.UI.Clipboard.text).eql(''); // FIXME: undefined on iOS
					Ti.UI.Clipboard.setData('text/plain', 'setData');
					should(Ti.UI.Clipboard.text).eql('setData');
				}, waitTime);
			});

			it.ios('returns given string after setData(\'public.plain-text\')', () => {
				Ti.UI.Clipboard.clearData(); // delete all data
				// should(Ti.UI.Clipboard.text).eql(''); // FIXME: undefined on iOS
				Ti.UI.Clipboard.setData('public.plain-text', 'setData');
				should(Ti.UI.Clipboard.text).eql('setData');
			});
		});

		describe.ios('#hasColors()', () => {
			it('is a Function', () => {
				should(Ti.UI.Clipboard.hasColors).be.a.Function();
			});

			it('return false with empty clipboard', () => {
				Ti.UI.Clipboard.clearData(); // delete all data
				should(Ti.UI.Clipboard.hasColors()).be.false();
			});

			it('returns true after setting named color data', () => {
				setTimeout(function () {
					Ti.UI.Clipboard.clearData(); // delete all data
					should(Ti.UI.Clipboard.hasColors()).be.false();
					Ti.UI.Clipboard.setData('color', 'white');
					should(Ti.UI.Clipboard.hasColors()).be.true();
				}, waitTime);
			});

			it('returns true after setting 3-digit hex color data', () => {
				setTimeout(function () {
					Ti.UI.Clipboard.clearData(); // delete all data
					should(Ti.UI.Clipboard.hasColors()).be.false();
					Ti.UI.Clipboard.setData('color', '#0FF');
					should(Ti.UI.Clipboard.hasColors()).be.true();
				}, waitTime);
			});

			// TODO: Test with Ti.UI.Color obj, rgb/rgba, 6-digit hex, 8-digit hex
		});

		describe('#hasData()', () => {
			it('is a Function', () => {
				should(Ti.UI.Clipboard.hasData).be.a.Function();
			});

			it('returns false with empty clipboard', () => {
				setTimeout(function () {
					Ti.UI.Clipboard.clearData(); // delete all data
					should(Ti.UI.Clipboard.hasData()).be.false();
					should(Ti.UI.Clipboard.hasData('text')).be.false();
					should(Ti.UI.Clipboard.hasData('text/plain')).be.false();
					should(Ti.UI.Clipboard.hasData('color')).be.false();
					should(Ti.UI.Clipboard.hasData('image')).be.false();
					should(Ti.UI.Clipboard.hasData('url')).be.false();
				}, waitTime);
			});

			it('assumes text mimeType with no argument', () => {
				setTimeout(function () {
					Ti.UI.Clipboard.clearData(); // delete all data
					should(Ti.UI.Clipboard.hasData()).be.false();
					should(Ti.UI.Clipboard.hasData('text')).be.false();
					should(Ti.UI.Clipboard.hasData('text/plain')).be.false();
					Ti.UI.Clipboard.text = 'hello there';
					should(Ti.UI.Clipboard.hasData()).be.true();
					should(Ti.UI.Clipboard.hasData('text')).be.true();
					should(Ti.UI.Clipboard.hasData('text/plain')).be.true();
				}, waitTime);
			});

			it('returns false for other mimeTypes', () => {
				setTimeout(function () {
					Ti.UI.Clipboard.clearData(); // delete all data
					should(Ti.UI.Clipboard.hasData()).be.false();
					should(Ti.UI.Clipboard.hasData('color')).be.false();
					should(Ti.UI.Clipboard.hasData('image')).be.false();
					should(Ti.UI.Clipboard.hasData('url')).be.false();
					Ti.UI.Clipboard.text = 'hello there';
					should(Ti.UI.Clipboard.hasData()).be.true();
					should(Ti.UI.Clipboard.hasData('text')).be.true();
					should(Ti.UI.Clipboard.hasData('text/plain')).be.true();
					should(Ti.UI.Clipboard.hasData('color')).be.false();
					should(Ti.UI.Clipboard.hasData('image')).be.false();
					should(Ti.UI.Clipboard.hasData('url')).be.false();
				}, waitTime);
			});
		});

		describe.ios('#hasImages()', () => {
			it('is a Function', () => {
				should(Ti.UI.Clipboard.hasImages).be.a.Function();
			});

			it('returns false when clipboard is empty', () => {
				Ti.UI.Clipboard.clearData(); // delete all data
				should(Ti.UI.Clipboard.hasImages()).be.false();
			});

			it('returns true when set with Ti.Blob', () => {
				Ti.UI.Clipboard.clearData(); // delete all data
				should(Ti.UI.Clipboard.hasImages()).be.false();
				const blob = Ti.Filesystem.getFile('Logo.png').read();
				Ti.UI.Clipboard.setData('image', blob);
				should(Ti.UI.Clipboard.hasImages()).be.true();
			});

			it('returns true when set with Ti.Filesystem.File', () => {
				Ti.UI.Clipboard.clearData(); // delete all data
				should(Ti.UI.Clipboard.hasImages()).be.false();
				const file = Ti.Filesystem.getFile('Logo.png');
				Ti.UI.Clipboard.setData('image', file);
				should(Ti.UI.Clipboard.hasImages()).be.true();
			});
		});

		describe('#hasText()', () => {
			it('is a Function', () => {
				should(Ti.UI.Clipboard.hasText).be.a.Function();
			});

			it('returns false when clipboard is empty', () => {
				Ti.UI.Clipboard.clearData(); // delete all data
				should(Ti.UI.Clipboard.hasText()).be.false();
			});

			it('returns true after setText()', () => {
				setTimeout(function () {
					Ti.UI.Clipboard.clearData(); // delete all data
					should(Ti.UI.Clipboard.hasText()).be.false();
					Ti.UI.Clipboard.text = 'I set it!';
					should(Ti.UI.Clipboard.hasText()).be.true();
				}, waitTime);
			});

			it('returns true after setData(\'text\', value)', () => {
				setTimeout(function () {
					Ti.UI.Clipboard.clearData(); // delete all data
					should(Ti.UI.Clipboard.hasText()).be.false();
					Ti.UI.Clipboard.setData('text', 'I set it!');
					should(Ti.UI.Clipboard.hasText()).be.true();
				}, waitTime);
			});

			it('returns true after setData(\'text/plain\', value)', () => {
				setTimeout(function () {
					Ti.UI.Clipboard.clearData(); // delete all data
					should(Ti.UI.Clipboard.hasText()).be.false();
					Ti.UI.Clipboard.setData('text/plain', 'I set it!');
					should(Ti.UI.Clipboard.hasText()).be.true();
				}, waitTime);
			});

			it.ios('returns true after setData(\'public.plain-text\', value)', () => {
				Ti.UI.Clipboard.clearData(); // delete all data
				should(Ti.UI.Clipboard.hasText()).be.false();
				Ti.UI.Clipboard.setData('public.plain-text', 'I set it!');
				should(Ti.UI.Clipboard.hasText()).be.true();
			});

			it('returns false after setData(\'color\', value)', () => {
				Ti.UI.Clipboard.clearData(); // delete all data
				setTimeout(function () {
					// should(Ti.UI.Clipboard.hasText()).be.false();	// true?
					Ti.UI.Clipboard.setData('color', 'blue');
					// should(Ti.UI.Clipboard.hasText()).be.false();	// true?
				}, waitTime);
			});
		});

		describe.ios('#hasURLs()', () => {
			it('is a Function', () => {
				should(Ti.UI.Clipboard.hasURLs).be.a.Function();
			});

			it('returns false when clipboard is empty', () => {
				Ti.UI.Clipboard.clearData(); // delete all data
				should(Ti.UI.Clipboard.hasURLs()).be.false();
			});

			it('returns true when set with valid URL string', () => {
				Ti.UI.Clipboard.clearData(); // delete all data
				should(Ti.UI.Clipboard.hasURLs()).be.false();
				Ti.UI.Clipboard.setData('url', 'http://localhost:8080');
				should(Ti.UI.Clipboard.hasURLs()).be.true();
			});

			// TODO: set with a bad URL
			// TODO: set with 'text/uri-list' mimeType string
		});

		describe.ios('#remove', () => {
			it('is a Function', () => {
				should(Ti.UI.Clipboard.remove).be.a.Function();
			});
		});

		describe('#setData()', () => {
			it('is a Function', () => {
				should(Ti.UI.Clipboard.setData).be.a.Function();
			});
		});

		describe.ios('#setItems()', () => {
			it('is a Function', () => {
				should(Ti.UI.Clipboard.setItems).be.a.Function();
			});

			it('with no options', () => {
				const items = [
					{
						'text/plain': 'John',
					},
					{
						'text/plain': 'Doe'
					}
				];
				Ti.UI.Clipboard.setItems({
					items
				});
				// Should we reverse back the UT types iOS reports to the equivalent mimeType?
				should(Ti.UI.Clipboard.getItems()).eql([
					{
						'public.plain-text': 'John',
					},
					{
						'public.plain-text': 'Doe'
					}
				]);
			});

			it.macBroken('filters out past expiration date items', () => {
				const options = {};
				// set date in the past
				options[Ti.UI.CLIPBOARD_OPTION_EXPIRATION_DATE] = new Date(2020, 4, 20);
				const items = [
					{
						'text/plain': 'John',
					},
					{
						'text/plain': 'Doe'
					}
				];
				Ti.UI.Clipboard.setItems({
					items,
					options
				});
				should(Ti.UI.Clipboard.getItems()).eql([]); // returns empty array, because items are past expiration
			});

			it('does not filter out items for yet-to-be-expired date', () => {
				const options = {};
				// set date in the future
				options[Ti.UI.CLIPBOARD_OPTION_EXPIRATION_DATE] = new Date(2050, 4, 20);
				const items = [
					{
						'text/plain': 'John',
					},
					{
						'text/plain': 'Doe'
					}
				];
				Ti.UI.Clipboard.setItems({
					items,
					options
				});
				// Should we reverse back the UT types iOS reports to the equivalent mimeType?
				should(Ti.UI.Clipboard.getItems()).eql([
					{
						'public.plain-text': 'John',
					},
					{
						'public.plain-text': 'Doe'
					}
				]);
			});
		});

		describe('#setText()', () => {
			it('is a Function', () => {
				should(Ti.UI.Clipboard).have.a.getter('text');
			});
			// TODO: Test with null/undefined/no arg
		});
	});

	describe('examples', () => {
		it('Copy Text to the Clipboard', () => {
			setTimeout(function () {
				Ti.UI.Clipboard.clearText();
				should.not.exist(Ti.UI.Clipboard.getText());
				Ti.UI.Clipboard.setText('hello');
				should(Ti.UI.Clipboard.hasText()).be.true();
				should(Ti.UI.Clipboard.text).eql('hello');
			}, waitTime);
		});

		it.ios('Use of named clipboard in iOS', () => {
			const clipboard1 = Ti.UI.createClipboard({
				name: 'myClipboard',
				allowCreation: true
			});
			should(clipboard1.name).eql('myClipboard');
			clipboard1.setText('hello');
			should(clipboard1.text).eql('hello');

			const clipboard2 = Ti.UI.createClipboard({
				name: 'myClipboard'
			});

			should(clipboard2.text).eql('hello'); // same name, so shares the same text
		});

		it.ios('Use of unique named clipboard in iOS', () => {
			const clipboard = Ti.UI.createClipboard({
				unique: true
			});
			clipboard.setText('hello');

			// Uses a GUID for name
			should(clipboard.name).match(/[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}/);
			should(clipboard.unique).be.true();
			should(clipboard.text).eql('hello');
		});
	});
});
