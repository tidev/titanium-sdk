/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint no-undef: "off" */
/* eslint mocha/no-identical-title: "off" */
'use strict';

const should = require('./utilities/assertions');

describe('Titanium.UI.ProgressBar', () => {
	let bar;
	afterEach(() => {
		bar = null;
	});

	describe('properties', () => {
		describe('.apiName', () => {
			beforeEach(() => {
				bar = Ti.UI.createProgressBar();
			});

			it('is a String', () => {
				should(bar).have.a.readOnlyProperty('apiName').which.is.a.String();
			});

			it('equals Ti.UI.ProgressBar', () => {
				should(bar.apiName).eql('Ti.UI.ProgressBar');
			});
		});

		describe('.animated', () => {
			it('is a Boolean', () => {
				const bar = Ti.UI.createProgressBar();
				should(bar).have.property('animated').which.is.a.Boolean();
			});

			it('defaults to true', () => {
				const bar = Ti.UI.createProgressBar();
				should(bar.animated).be.true();
			});

			it('can be initialized false', () => {
				const bar = Ti.UI.createProgressBar({ animated: false });
				should(bar.animated).be.false();
			});

			it('can be set false', () => {
				const bar = Ti.UI.createProgressBar();
				bar.animated = false;
				should(bar.animated).be.false();
			});
		});

		describe('.color', () => {
			beforeEach(() => {
				bar = Ti.UI.createProgressBar({ color: 'red' });
			});

			it('is a String', () => {
				should(bar).have.property('color').which.is.a.String();
			});

			it('equals value passed to factory method', () => {
				should(bar.color).eql('red');
			});

			it('can be assigned a String value', () => {
				bar.color = 'blue';
				should(bar.color).eql('blue');
			});

			it('has no accessors', () => {
				should(bar).not.have.accessors('color');
			});
		});

		// FIXME: Add android support for the font property
		describe.ios('.font', () => {
			beforeEach(() => {
				bar = Ti.UI.createProgressBar({
					font: {
						fontSize: 24,
						fontFamily: 'Segoe UI'
					}
				});
			});

			it('is an Object', () => {
				should(bar).have.a.property('font').which.is.an.Object();
			});

			it('has no accessors', () => {
				should(bar).not.have.accessors('font');
			});
		});

		describe('.max', () => {
			beforeEach(() => {
				bar = Ti.UI.createProgressBar({
					max: 0
				});
			});

			it('is a Number', () => {
				should(bar).have.a.property('max').which.is.a.Number();
			});

			it('equals value passed to factory method', () => {
				should(bar.max).eql(0);
			});

			it('can be assigned an Integer value', () => {
				bar.max = 100;
				should(bar.max).eql(100);
			});

			it('has no accessors', () => {
				should(bar).not.have.accessors('max');
			});
		});

		describe('.message', () => {
			beforeEach(() => {
				bar = Ti.UI.createProgressBar({
					message: 'this is some text'
				});
			});

			it('is a String', () => {
				should(bar.message).be.a.String();
			});

			it('equals value passed to factory method', () => {
				should(bar.message).eql('this is some text');
			});

			it('can be assigned a String value', () => {
				bar.message = 'other text';
				should(bar.message).eql('other text');
			});

			it('has no accessors', () => {
				should(bar).not.have.accessors('message');
			});
		});

		describe('.min', () => {
			beforeEach(() => {
				bar = Ti.UI.createProgressBar({
					min: 0
				});
			});

			it('is a Number', () => {
				should(bar).have.a.property('min').which.is.a.Number();
			});

			it('equals value passed to factory method', () => {
				should(bar.min).eql(0);
			});

			it('can be assigned an Integer value', () => {
				bar.min = 100;
				should(bar.min).eql(100);
			});

			it('has no accessors', () => {
				should(bar).not.have.accessors('min');
			});
		});

		describe.ios('.style', () => {
			beforeEach(() => {
				bar = Ti.UI.createProgressBar({ style: Ti.UI.iOS.ProgressBarStyle.BAR });
			});

			it('is a Number', () => {
				should(bar).have.a.property('style').which.is.a.Number();
			});

			it('equals value passed to factory method', () => {
				should(bar.style).eql(Ti.UI.iOS.ProgressBarStyle.BAR);
			});

			it('can be assigned a constant value', () => {
				bar.style = Ti.UI.iOS.ProgressBarStyle.PLAIN;
				should(bar.style).eql(Ti.UI.iOS.ProgressBarStyle.PLAIN);
			});

			it('has no accessors', () => {
				should(bar).not.have.accessors('style');
			});
		});

		describe('.tintColor', () => {
			beforeEach(() => {
				bar = Ti.UI.createProgressBar({ tintColor: 'red' });
			});

			it('is a String', () => {
				should(bar).have.property('tintColor').which.is.a.String();
			});

			it('equals value passed to factory method', () => {
				should(bar.tintColor).eql('red');
			});

			it('can be assigned a String value', () => {
				bar.tintColor = 'blue';
				should(bar.tintColor).eql('blue');
			});

			it('has no accessors', () => {
				should(bar).not.have.accessors('tintColor');
			});
		});

		describe('.trackTintColor', () => {
			beforeEach(() => {
				bar = Ti.UI.createProgressBar({ trackTintColor: 'red' });
			});

			it('is a String', () => {
				should(bar).have.property('trackTintColor').which.is.a.String();
			});

			it('equals value passed to factory method', () => {
				should(bar.trackTintColor).eql('red');
			});

			it('can be assigned a String value', () => {
				bar.trackTintColor = 'blue';
				should(bar.trackTintColor).eql('blue');
			});

			it('has no accessors', () => {
				should(bar).not.have.accessors('trackTintColor');
			});
		});

		describe('.value', () => {
			beforeEach(() => {
				bar = Ti.UI.createProgressBar({ value: 0 });
			});

			it('is a Number', () => {
				should(bar).have.a.property('value').which.is.a.Number();
			});

			it('equals value passed to factory method', () => {
				should(bar.value).eql(0);
			});

			it('can be assigned an Integer value', () => {
				bar.value = 100;
				should(bar.value).eql(100);
			});

			it('has no accessors', () => {
				should(bar).not.have.accessors('value');
			});
		});
	});
});
