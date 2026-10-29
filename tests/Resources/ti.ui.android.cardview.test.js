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

describe.android('Titanium.UI.Android.CardView', function () {
	this.timeout(5000);

	let win;
	afterEach(done => { // fires after every test in sub-suites too...
		if (win && !win.closed) {
			win.addEventListener('close', function listener () {
				win.removeEventListener('close', listener);
				win = null;
				done();
			});
			win.close();
		} else {
			win = null;
			done();
		}
	});

	it.iosBroken('Ti.UI.Android.CardView', () => {
		should(Ti.UI.Android.CardView).not.be.undefined();
	});

	it('.apiName', () => {
		const cardView = Ti.UI.Android.createCardView();
		should(cardView).have.readOnlyProperty('apiName').which.is.a.String();
		should(cardView.apiName).be.eql('Ti.UI.Android.CardView');
	});

	it('createCardView', (finish) => {
		should(Ti.UI.Android.createCardView).not.be.undefined();
		should(Ti.UI.Android.createCardView).be.a.Function();

		win = Ti.UI.createWindow();
		win.add(Ti.UI.Android.createCardView());
		win.addEventListener('postlayout', function listener() {
			win.removeEventListener('postlayout', listener);
			finish();
		});
		win.open();
	});

	it('.backgroundColor', (finish) => {
		win = Ti.UI.createWindow();
		const cardView = Ti.UI.Android.createCardView({
			backgroundColor: 'orange'
		});
		should(cardView.backgroundColor).be.eql('orange');
		win.add(cardView);
		win.addEventListener('postlayout', function listener() {
			win.removeEventListener('postlayout', listener);
			finish();
		});
		win.open();
	});

	it('.borderRadius (single value)', (finish) => {
		win = Ti.UI.createWindow();
		const cardView = Ti.UI.Android.createCardView({
			borderRadius: 20
		});
		win.add(cardView);
		win.addEventListener('postlayout', function listener() {
			win.removeEventListener('postlayout', listener);
			finish();
		});
		win.open();
	});

	it('.borderRadius (array of radii)', (finish) => {
		win = Ti.UI.createWindow();
		const cardView = Ti.UI.Android.createCardView({
			borderRadius: [ 0, 0, 20, 20 ]
		});
		win.add(cardView);
		win.addEventListener('postlayout', function listener() {
			win.removeEventListener('postlayout', listener);
			finish();
		});
		win.open();
	});

	it('.borderRadius (string of radii)', (finish) => {
		win = Ti.UI.createWindow();
		const cardView = Ti.UI.Android.createCardView({
			borderRadius: '0 0 20 20'
		});
		win.add(cardView);
		win.addEventListener('postlayout', function listener() {
			win.removeEventListener('postlayout', listener);
			finish();
		});
		win.open();
	});

	it('.borderWidth (single value)', (finish) => {
		win = Ti.UI.createWindow();
		const cardView = Ti.UI.Android.createCardView({
			borderColor: 'red',
			borderWidth: 4
		});
		win.add(cardView);
		win.addEventListener('postlayout', function listener() {
			win.removeEventListener('postlayout', listener);
			try {
				should(cardView.borderWidth).eql(4);
				cardView.borderWidth = '6dp';
				should(cardView.borderWidth).eql('6dp');
			} catch (err) {
				return finish(err);
			}
			finish();
		});
		win.open();
	});

	it('.borderWidth (array of widths uses first value)', (finish) => {
		win = Ti.UI.createWindow();
		const cardView = Ti.UI.Android.createCardView({
			borderColor: 'red',
			borderWidth: [ 4, 8, 12, 16 ]
		});
		win.add(cardView);
		win.addEventListener('postlayout', function listener() {
			win.removeEventListener('postlayout', listener);
			try {
				should(cardView.borderWidth).eql([ 4, 8, 12, 16 ]);
				cardView.borderWidth = [ 2, 6 ];
				should(cardView.borderWidth).eql([ 2, 6 ]);
			} catch (err) {
				return finish(err);
			}
			finish();
		});
		win.open();
	});

	it('.borderWidth (string of widths uses first value)', (finish) => {
		win = Ti.UI.createWindow();
		const cardView = Ti.UI.Android.createCardView({
			borderColor: 'red',
			borderWidth: '4 8 12 16'
		});
		win.add(cardView);
		win.addEventListener('postlayout', function listener() {
			win.removeEventListener('postlayout', listener);
			try {
				should(cardView.borderWidth).eql('4 8 12 16');
				cardView.borderWidth = '2 6';
				should(cardView.borderWidth).eql('2 6');
			} catch (err) {
				return finish(err);
			}
			finish();
		});
		win.open();
	});

	it('.touchFeedback', (finish) => {
		win = Ti.UI.createWindow();
		const cardView = Ti.UI.Android.createCardView({
			touchFeedback: false
		});
		should(cardView.touchFeedback).be.false();
		win.add(cardView);
		win.addEventListener('postlayout', function listener() {
			win.removeEventListener('postlayout', listener);
			finish();
		});
		win.open();
	});

	it('.touchFeedbackColor', (finish) => {
		win = Ti.UI.createWindow();
		const cardView = Ti.UI.Android.createCardView({
			touchFeedbackColor: 'yellow'
		});
		should(cardView.touchFeedbackColor).be.eql('yellow');
		win.add(cardView);
		win.addEventListener('postlayout', function listener() {
			win.removeEventListener('postlayout', listener);
			finish();
		});
		win.open();
	});
});
