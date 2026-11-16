/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint mocha/no-identical-title: "off" */
'use strict';

const should = require('./utilities/assertions');

describe('Titanium.UI.OptionDialog', () => {

	describe('properties', () => {
		describe('.apiName', () => {
			it('is a read-only String', () => {
				const dialog = Ti.UI.createOptionDialog();
				should(dialog).have.readOnlyProperty('apiName').which.is.a.String();
			});
			it('equals Ti.UI.OptionDialog', () => {
				const dialog = Ti.UI.createOptionDialog();
				should(dialog.apiName).be.eql('Ti.UI.OptionDialog');
			});
		});

		describe.android('.buttonNames', () => {
			let dialog;
			beforeEach(() => {
				dialog = Ti.UI.createOptionDialog({});
			});

			it.androidBroken('is an Array', () => { // defaults to undefined
				should(dialog.buttonNames).be.an.Array();
			});

			it.androidBroken('is empty', () => { // defaults to undefined
				should(dialog.buttonNames).be.empty();
			});

			it('can be assigned string[]', () => {
				dialog.buttonNames = [ 'this', 'other' ];
				should(dialog.buttonNames.length).eql(2);
			});

			it('has no accessors', () => {
				should(dialog).not.have.accessors('buttonNames');
			});
		});

		describe('.cancel', () => {
			let dialog;
			beforeEach(() => {
				dialog = Ti.UI.createOptionDialog({});
			});

			it.allBroken('is a Number', () => { // defaults to undefined
				should(dialog.cancel).be.a.Number();
			});

			it.allBroken('defaults to -1', () => { // defaults to undefined
				should(dialog.cancel).eql(-1);
			});

			it('can be assigned new Number value', () => {
				dialog.cancel = 1;
				should(dialog.cancel).eql(1);
			});

			it('has no accessors', () => {
				should(dialog).not.have.accessors('cancel');
			});
		});

		describe('.options', () => {
			let dialog;
			beforeEach(() => {
				dialog = Ti.UI.createOptionDialog({});
			});

			// it('is an Array', () => {
			// 	should(dialog.options).be.an.Array(); // undefined on Android
			// });

			// it('is empty', () => {
			// 	should(dialog.options).be.empty();
			// });

			it('defaults to undefined', () => {
				should(dialog.options).be.undefined();
			});

			it('can be assigned string[]', () => {
				dialog.options = [ 'this', 'other' ];
				should(dialog.options.length).eql(2);
			});

			it('has no accessors', () => {
				should(dialog).not.have.accessors('options');
			});
		});

		// FIXME Get working on iOS and Android. persistent is defaulting to undefined? Docs say should be true
		describe('.persistent', () => {
			let dialog;
			beforeEach(() => {
				dialog = Ti.UI.createOptionDialog({
					title: 'this is some text'
				});
			});

			it.allBroken('is a Boolean', () => { // defaults to undefined
				should(dialog.persistent).be.a.Boolean();
			});

			it.allBroken('defaults to true', () => { // defaults to undefined
				should(dialog.persistent).be.true();
			});

			it('can be assigned new Boolean value', () => {
				dialog.persistent = false;
				should(dialog.persistent).be.false();
			});

			it('has no accessors', () => {
				should(dialog).not.have.accessors('persistent');
			});
		});

		// FIXME Get working on Android, defaults to undefined on Android
		describe.iosMissing('.selectedIndex', () => {
			let dialog;
			beforeEach(() => {
				dialog = Ti.UI.createOptionDialog({
					title: 'this is some text'
				});
			});

			it.androidBroken('is a Number', () => { // defaults to undefined
				should(dialog.selectedIndex).be.a.Number();
			});

			it('can be assigned new value', () => {
				dialog.selectedIndex = 1;
				should(dialog.selectedIndex).eql(1);
			});

			it('has no accessors', () => {
				should(dialog).not.have.accessors('selectedIndex');
			});
		});

		describe('.title', () => {
			let dialog;
			beforeEach(() => {
				dialog = Ti.UI.createOptionDialog({
					title: 'this is some text'
				});
			});

			it('is a String', () => {
				should(dialog.title).be.a.String();
			});

			it('equal to value set in factory method dictionary', () => {
				should(dialog.title).eql('this is some text');
			});

			it('can be assigned new value', () => {
				dialog.title = 'other text';
				should(dialog.title).eql('other text');
			});

			it('has no accessors', () => {
				should(dialog).not.have.accessors('title');
			});
		});

		describe('.titleid', () => {
			let dialog;
			beforeEach(() => {
				dialog = Ti.UI.createOptionDialog({
					titleid: 'this_is_my_key'
				});
			});

			it('is a String', () => {
				should(dialog.titleid).be.a.String();
			});

			it('equal to value set in factory method dictionary', () => {
				should(dialog.titleid).eql('this_is_my_key');
			});

			it.iosBroken('modifies .title property value', () => {
				should(dialog.title).eql('this is my value');
			});

			it('can be assigned new value', () => {
				dialog.titleid = 'other text';
				should(dialog.titleid).eql('other text');
				// should(dialog.title).eql('this is my value'); // broken on iOS
			});

			it('has no accessors', () => {
				should(dialog).not.have.accessors('titleid');
			});
		});
	});

	describe('methods', () => {

	});
});
