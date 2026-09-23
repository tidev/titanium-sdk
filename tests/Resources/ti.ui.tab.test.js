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

describe('Titanium.UI.Tab', () => {
	describe('properties', () => {
		describe('.activeTintColor', () => {
			let tab;
			beforeEach(() => {
				tab = Ti.UI.createTab({
					activeTintColor: 'red'
				});
			});

			it('is a String', () => {
				should(tab).have.property('activeTintColor').which.is.a.String();
			});

			it('equals value passed to factory method', () => {
				should(tab.activeTintColor).eql('red');
			});

			it('can be assigned a String value', () => {
				tab.activeTintColor = 'blue';
				should(tab.activeTintColor).eql('blue');
			});

			it('has no accessors', () => {
				should(tab).not.have.accessors('activeTintColor');
			});
		});

		describe('.activeTintColor', () => {
			let tab;
			beforeEach(() => {
				tab = Ti.UI.createTab({
					activeTitleColor: 'red'
				});
			});

			it('is a String', () => {
				should(tab).have.property('activeTitleColor').which.is.a.String();
			});

			it('equals value passed to factory method', () => {
				should(tab.activeTitleColor).eql('red');
			});

			it('can be assigned a String value', () => {
				tab.activeTitleColor = 'blue';
				should(tab.activeTitleColor).eql('blue');
			});

			it('has no accessors', () => {
				should(tab).not.have.accessors('activeTitleColor');
			});
		});

		describe('.apiName', () => {
			it('is a String', () => {
				const tab = Ti.UI.createTab();
				should(tab).have.readOnlyProperty('apiName').which.is.a.String();
			});

			it('equals \'Ti.UI.Tab\'', () => {
				const tab = Ti.UI.createTab();
				should(tab.apiName).be.eql('Ti.UI.Tab');
			});
		});

		// NOTE: These badge tests require a custom theme extending Material theme on Android
		// We do that in our tiapp.xml
		describe('.badge', () => {
			let tab;
			beforeEach(() => {
				tab = Ti.UI.createTab({
					badge: 3
				});
			});

			it('is a Number', () => {
				should(tab.badge).be.a.Number();
			});

			it('equals value passed to factory method', () => {
				should(tab.badge).eql(3);
			});

			it('can be assigned an Integer value', () => {
				tab.badge = 2;
				should(tab.badge).eql(2);
			});

			it('has no accessors', () => {
				should(tab).not.have.accessors('badge');
			});
		});

		describe('.badgeColor', () => {
			let tab;
			beforeEach(() => {
				tab = Ti.UI.createTab({
					badge: 3,
					badgeColor: '#123'
				});
			});

			it('is a String', () => {
				should(tab).have.property('badgeColor').which.is.a.String();
			});

			it('equals value passed to factory method', () => {
				should(tab.badgeColor).eql('#123');
			});

			it('can be assigned a String value', () => {
				tab.badgeColor = 'blue';
				should(tab.badgeColor).eql('blue');
			});

			it('has no accessors', () => {
				should(tab).not.have.accessors('badgeColor');
			});
		});

		describe('.tintColor', () => {
			let tab;
			beforeEach(() => {
				tab = Ti.UI.createTab({
					tintColor: 'red'
				});
			});

			it('is a String', () => {
				should(tab).have.property('tintColor').which.is.a.String();
			});

			it('equals value passed to factory method', () => {
				should(tab.tintColor).eql('red');
			});

			it('can be assigned a String value', () => {
				tab.tintColor = 'blue';
				should(tab.tintColor).eql('blue');
			});

			it('has no accessors', () => {
				should(tab).not.have.accessors('tintColor');
			});
		});

		describe('.title', () => {
			let tab;
			beforeEach(() => {
				tab = Ti.UI.createTab({
					title: 'this is some text'
				});
			});

			it('is a String', () => {
				should(tab.title).be.a.String();
			});

			it('equal to value set in factory method dictionary', () => {
				should(tab.title).eql('this is some text');
			});

			it('can be assigned new value', () => {
				tab.title = 'other text';
				should(tab.title).eql('other text');
			});

			it('has no accessors', () => {
				should(tab).not.have.accessors('title');
			});
		});

		describe('.titleid', () => {
			let tab;
			beforeEach(() => {
				tab = Ti.UI.createTab({
					titleid: 'this_is_my_key'
				});
			});

			it('is a String', () => {
				should(tab.titleid).be.a.String();
			});

			it('equal to value set in factory method dictionary', () => {
				should(tab.titleid).eql('this_is_my_key');
			});

			it('modifies .title property value', () => {
				should(tab.title).eql('this is my value');
			});

			it('can be assigned new value', () => {
				tab.titleid = 'other text';
				should(tab.titleid).eql('other text');
				should(tab.title).eql('this is my value');
			});

			it('has no accessors', () => {
				should(tab).not.have.accessors('titleid');
			});
		});

		describe('.titleColor', () => {
			let tab;
			beforeEach(() => {
				tab = Ti.UI.createTab({
					titleColor: 'red'
				});
			});

			it('is a String', () => {
				should(tab).have.property('titleColor').which.is.a.String();
			});

			it('equals value passed to factory method', () => {
				should(tab.titleColor).eql('red');
			});

			it('can be assigned a String value', () => {
				tab.titleColor = 'blue';
				should(tab.titleColor).eql('blue');
			});

			it('has no accessors', () => {
				should(tab).not.have.accessors('titleColor');
			});
		});
	});
});
