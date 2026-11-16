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

describe('Titanium.UI.ActivityIndicator', () => {
	it('.apiName', () => {
		const activityIndicator = Ti.UI.createActivityIndicator();
		should(activityIndicator).have.readOnlyProperty('apiName').which.is.a.String();
		should(activityIndicator.apiName).be.eql('Ti.UI.ActivityIndicator');
	});

	describe('.color', () => {
		it('can be assigned a String value', () => {
			const activityIndicator = Ti.UI.createActivityIndicator({
				color: '#fff'
			});
			should(activityIndicator.color).be.a.String();
			should(activityIndicator.color).eql('#fff');
			activityIndicator.color = '#000';
			should(activityIndicator.color).eql('#000');
		});

		it('has no accessors', () => {
			const activityIndicator = Ti.UI.createActivityIndicator({
				color: '#fff'
			});
			should(activityIndicator).not.have.accessors('color');
		});
	});

	describe('.font', () => {
		it('can be assigned Font object', () => {
			const activityIndicator = Ti.UI.createActivityIndicator({
				font: {
					fontSize: 24,
					fontFamily: 'Segoe UI'
				}
			});
			should(activityIndicator.font).be.a.Object();
			should(activityIndicator.font.fontSize).eql(24);
			should(activityIndicator.font.fontFamily).eql('Segoe UI');
			activityIndicator.font = {
				fontSize: 11,
				fontFamily: 'Segoe UI Semilight'
			};
			should(activityIndicator.font.fontSize).eql(11);
			should(activityIndicator.font.fontFamily).eql('Segoe UI Semilight');
		});

		it('has no accessors', () => {
			const activityIndicator = Ti.UI.createActivityIndicator({
				font: {
					fontSize: 24,
					fontFamily: 'Segoe UI'
				}
			});
			should(activityIndicator).not.have.accessors('font');
		});
	});

	describe('.message', () => {
		it('can be assigned a String value', () => {
			const activityIndicator = Ti.UI.createActivityIndicator({
				message: 'this is some text'
			});
			should(activityIndicator.message).be.a.String();
			should(activityIndicator.message).eql('this is some text');
			activityIndicator.message = 'other text';
			should(activityIndicator.message).eql('other text');
		});

		it('has no accessors', () => {
			const activityIndicator = Ti.UI.createActivityIndicator({
				message: 'this is some text'
			});
			should(activityIndicator).not.have.accessors('message');
		});
	});

	describe('.style', () => {
		it('can be assigned one of Numeric constants', () => {
			const activityIndicator = Ti.UI.createActivityIndicator({
				style: Ti.UI.ActivityIndicatorStyle.BIG
			});
			should(activityIndicator.style).be.a.Number();
			should(activityIndicator.style).eql(Ti.UI.ActivityIndicatorStyle.BIG);
			activityIndicator.style = Ti.UI.ActivityIndicatorStyle.DARK;
			should(activityIndicator.style).eql(Ti.UI.ActivityIndicatorStyle.DARK);
		});

		it('has no accessors', () => {
			const activityIndicator = Ti.UI.createActivityIndicator({
				style: Ti.UI.ActivityIndicatorStyle.BIG
			});
			should(activityIndicator).not.have.accessors('style');
		});
	});

	describe('.indicatorColor', () => {
		it('can be assigned/read a String', () => {
			const activityIndicator = Ti.UI.createActivityIndicator({
				indicatorColor: '#fff'
			});
			should(activityIndicator.indicatorColor).be.a.String();
			should(activityIndicator.indicatorColor).eql('#fff');
			activityIndicator.indicatorColor = '#000';
			should(activityIndicator.indicatorColor).eql('#000');
		});

		it('has no accessors', () => {
			const activityIndicator = Ti.UI.createActivityIndicator({
				indicatorColor: '#fff'
			});
			should(activityIndicator).not.have.accessors('indicatorColor');
		});
	});
});
