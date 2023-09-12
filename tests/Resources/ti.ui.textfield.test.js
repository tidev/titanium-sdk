/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env titanium, mocha */
/* eslint no-unused-expressions: "off" */
/* eslint mocha/no-identical-title: "off" */
'use strict';
const should = require('./utilities/assertions');
const utilities = require('./utilities/utilities');

describe('Titanium.UI.TextField', () => {
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

	describe('properties', () => {
		describe('.apiName', () => {
			it('is a String', () => {
				const textField = Ti.UI.createTextField({});
				should(textField).have.readOnlyProperty('apiName').which.is.a.String();
			});

			it('equals \'Ti.UI.TextField\'', () => {
				const textField = Ti.UI.createTextField({});
				should(textField.apiName).be.eql('Ti.UI.TextField');
			});
		});

		describe('.enableCopy', () => {
			it('is a Boolean', () => {
				const textField = Ti.UI.createTextField();
				should(textField).have.readOnlyProperty('enableCopy').which.is.a.Boolean();
			});

			it('defaults to true', () => {
				const textField = Ti.UI.createTextField();
				should(textField.enableCopy).be.true();
			});

			it('can be initialized false', () => {
				const textField = Ti.UI.createTextField({ enableCopy: false });
				should(textField.enableCopy).be.false();
			});

			it('can be changed dynamically', (finish) => {
				const textField = Ti.UI.createTextField();
				win = Ti.UI.createWindow({ backgroundColor: '#fff' });
				win.add(textField);
				win.addEventListener('postlayout', function listener() {
					try {
						win.removeEventListener('postlayout', listener);
						textField.enableCopy = false;
						should(textField.enableCopy).be.false();
						finish();
					} catch (err) {
						finish(err);
					}
				});
				win.open();
			});
		});

		it('.focused', done => {
			win = Ti.UI.createWindow({ backgroundColor: '#fff' });
			const textField = Ti.UI.createTextField({
				backgroundColor: '#fafafa',
				color: 'green',
				width: 250,
				height: 40
			});
			win.add(textField);
			try {
				textField.should.have.a.property('focused').which.is.a.Boolean();
				textField.focused.should.be.false(); // haven't opened it yet, so shouldn't be focused
				textField.addEventListener('focus', () => {
					try {
						textField.focused.should.be.true();
					} catch (e) {
						return done(e);
					}
					win.close();
				});
				win.addEventListener('open', () => {
					textField.focus(); // force focus!
				});
				win.addEventListener('close', () => {
					try {
						// we've been closed (or are closing?) so hopefully shouldn't say that we're focused
						textField.focused.should.be.false();
					} catch (e) {
						return done(e);
					}
					done();
				});
				win.open();
			} catch (e) {
				return done(e);
			}
		});

		// FIXME Intermittently failing on Android on build machine, I think due to test timeout
		it.androidBroken('.height', function (finish) {
			this.timeout(5000);
			const textField = Ti.UI.createTextField({
				value: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec nec ullamcorper massa, eget tempor sapien. Phasellus nisi metus, tempus a magna nec, ultricies rutrum lacus. Aliquam sit amet augue suscipit, dignissim tellus eu, consectetur elit. Praesent ligula velit, blandit vel urna sit amet, suscipit euismod nunc.',
				width: Ti.UI.SIZE,
				height: Ti.UI.SIZE,
				color: 'black'
			});
			const bgView = Ti.UI.createView({
				width: 200,
				height: 100,
				backgroundColor: 'red'
			});
			win = Ti.UI.createWindow({
				backgroundColor: '#eee'
			});
			bgView.add(textField);
			win.add(bgView);

			win.addEventListener('focus', function () {
				try {
					should(bgView.height).be.eql(100);
					should(textField.height).not.be.greaterThan(100);
				} catch (err) {
					return finish(err);
				}
				finish();
			});
			win.open();
		});

		describe('.hintText', () => {
			let textField;
			beforeEach(() => {
				textField = Ti.UI.createTextField({
					hintText: 'Enter E-Mail ...'
				});
			});

			it('is a String', () => {
				should(textField).have.property('hintText').which.is.a.String();
			});

			it('equals value passed to factory method', () => {
				should(textField.hintText).eql('Enter E-Mail ...');
			});

			it('can be assigned a String value', () => {
				textField.hintText = 'Enter Name ...';
				should(textField.hintText).eql('Enter Name ...');
			});

			it('has no accessors', () => {
				should(textField).not.have.accessors('hintText');
			});
		});

		describe.windowsMissing('.hintTextColor', () => {
			let textField;
			beforeEach(() => {
				textField = Ti.UI.createTextField({
					hintText: 'Enter E-Mail ...',
					hintTextColor: 'red'
				});
			});

			it('is a String', () => {
				should(textField).have.property('hintTextColor').which.is.a.String();
			});

			it('equals value passed to factory method', () => {
				should(textField.hintTextColor).eql('red');
			});

			it('can be assigned a String value', () => {
				textField.hintTextColor = 'blue';
				should(textField.hintTextColor).eql('blue');
			});

			it('has no accessors', () => {
				should(textField).not.have.accessors('hintTextColor');
			});
		});

		describe.android('.hintType', () => {
			let textField;
			beforeEach(() => {
				textField = Ti.UI.createTextField({
					hintText: 'Enter E-Mail ...',
					hintType: Ti.UI.HINT_TYPE_ANIMATED
				});
			});

			it('is a Number', () => {
				should(textField).have.property('hintType').which.is.a.Number();
			});

			it('equals value passed to factory method', () => {
				should(textField.hintType).eql(Ti.UI.HINT_TYPE_ANIMATED);
			});

			it('can be assigned a constant value', () => {
				textField.hintType = Ti.UI.HINT_TYPE_STATIC;
				should(textField.hintType).eql(Ti.UI.HINT_TYPE_STATIC);
			});

			it('has no accessors', () => {
				should(textField).not.have.accessors('hintType');
			});
		});

		// Skip on Windows Phone since not available, yet
		describe.windowsMissing('.padding', () => {
			let textField;
			beforeEach(() => {
				textField = Ti.UI.createTextField({
					value: 'this is some text',
					padding: {
						left: 20,
						right: 20
					}
				});
			});

			it('is an Object', () => {
				should(textField).have.property('padding').which.is.an.Object();
			});

			it('equals value passed to factory method', () => {
				should(textField.padding.left).eql(20);
				should(textField.padding.right).eql(20);
			});

			it('can be assigned an Object value', () => {
				textField.padding = {
					left: 10,
					right: 10
				};

				should(textField.padding.left).eql(10);
				should(textField.padding.right).eql(10);
			});

			it('has no accessors', () => {
				should(textField).not.have.accessors('padding');
			});
		});

		// FIXME Defaults to undefined on Android. Docs say default is false
		it.androidBroken('.passwordMask', function () {
			const text = 'this is some text',
				textField = Ti.UI.createTextField({
					value: text
				});
			// passwordMask should default to false
			should(textField.passwordMask).be.false(); // undefined on Android
			textField.passwordMask = true;
			should(textField.passwordMask).be.true();
			// it should have same text before
			should(textField.value).be.eql(text);
		});

		it.ios('.passwordRules', () => {
			const textField = Ti.UI.createTextField({
				passwordMask: true,
				passwordRules: 'required: upper; required: lower; required: digit; max-consecutive: 2'
			});
			should(textField.passwordRules).equal('required: upper; required: lower; required: digit; max-consecutive: 2');
		});

		describe('.textAlign', () => {
			let textField;
			beforeEach(() => {
				textField = Ti.UI.createTextField({
					value: 'this is some text',
					textAlign: Titanium.UI.TEXT_ALIGNMENT_CENTER
				});
			});

			it('is a String on Android, Number on iOS', () => {
				// FIXME Parity issue!
				if (utilities.isAndroid()) {
					should(textField.textAlign).be.a.String();
				} else {
					should(textField.textAlign).be.a.Number();
				}
			});

			it('equals value passed to factory method', () => {
				should(textField.textAlign).eql(Titanium.UI.TEXT_ALIGNMENT_CENTER);
			});

			it('can be assigned a constant value', () => {
				textField.textAlign = Titanium.UI.TEXT_ALIGNMENT_RIGHT;
				should(textField.textAlign).eql(Titanium.UI.TEXT_ALIGNMENT_RIGHT);
			});

			it('has no accessors', () => {
				should(textField).not.have.accessors('textAlign');
			});
		});

		describe('.value', () => {
			let textField;
			beforeEach(() => {
				textField = Ti.UI.createTextField({
					value: 'this is some text'
				});
			});

			it('is a String', () => {
				should(textField.value).be.a.String();
			});

			it('equals value passed to factory method', () => {
				should(textField.value).eql('this is some text');
			});

			it('can be assigned a constant value', () => {
				textField.value = 'other text';
				should(textField.value).eql('other text');
			});

			it('has no accessors', () => {
				should(textField).not.have.accessors('value');
			});
		});

		describe('.verticalAlign', () => {
			let textField;
			beforeEach(() => {
				textField = Ti.UI.createTextField({
					value: 'this is some text',
					verticalAlign: Titanium.UI.TEXT_VERTICAL_ALIGNMENT_BOTTOM
				});
			});

			it('is a String on Android, Number on iOS', () => {
				// FIXME Parity issue!
				if (utilities.isAndroid()) {
					should(textField.verticalAlign).be.a.String();
				} else {
					should(textField.verticalAlign).be.a.Number();
				}
			});

			it('equals value passed to factory method', () => {
				should(textField.verticalAlign).eql(Titanium.UI.TEXT_VERTICAL_ALIGNMENT_BOTTOM);
			});

			it('can be assigned a constant value', () => {
				textField.verticalAlign = Titanium.UI.TEXT_VERTICAL_ALIGNMENT_TOP;
				should(textField.verticalAlign).eql(Titanium.UI.TEXT_VERTICAL_ALIGNMENT_TOP);
			});

			it('has no accessors', () => {
				should(textField).not.have.accessors('verticalAlign');
			});
		});

		// TODO Add tests for:
		// autocapitalize
		// autocorrect
		// borderStyle
		// clearonEdit
		// color
		// editable
		// enableReturnKey
		// font
		// keyboardType
		// maxLength
		// returnKeyType
		// selection
		// suppressReturn

		it('.width', function (finish) {
			this.timeout(5000);
			const textField = Ti.UI.createTextField({
				value: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec nec ullamcorper massa, eget tempor sapien. Phasellus nisi metus, tempus a magna nec, ultricies rutrum lacus. Aliquam sit amet augue suscipit, dignissim tellus eu, consectetur elit. Praesent ligula velit, blandit vel urna sit amet, suscipit euismod nunc.',
				width: Ti.UI.SIZE
			});
			win = Ti.UI.createWindow({
				backgroundColor: '#ddd'
			});
			win.add(textField);
			win.addEventListener('postlayout', function listener () {
				win.removeEventListener('postlayout', listener);
				try {
					should(win.rect.width).be.greaterThan(100);
					should(textField.rect.width).not.be.greaterThan(win.rect.width);
				} catch (err) {
					return finish(err);
				}
				finish();
			});
			win.open();
		});
	});

	describe('methods', () => {
		it.ios('#hasText()', () => {
			win = Ti.UI.createWindow();
			const textFieldA = Ti.UI.createTextField({
				top: '60dip',
				value: 0
			});

			win.add(textFieldA);

			const textFieldB = Ti.UI.createTextField({
				top: '120dip',
				value: 0
			});

			win.add(textFieldB);

			should(textFieldA.hasText()).be.true();
			should(textFieldB.hasText()).be.true();
		});

		it('#setSelection', function (finish) {
			this.timeout(5000);
			const textField = Ti.UI.createTextField({
				value: 'Lorem ipsum dolor sit amet.',
				width: Ti.UI.SIZE
			});
			win = Ti.UI.createWindow({
				backgroundColor: '#ddd'
			});
			win.add(textField);
			win.addEventListener('postlayout', function listener () {
				win.removeEventListener('postlayout', listener);
				textField.setSelection(0, 5);
				setTimeout(function () {
					try {
						should(textField.selection.length).eql(5);
						should(textField.selection.location).eql(0);
					} catch (err) {
						return finish(err);
					}
					finish();
				}, 1000);
			});
			win.open();
		});
	});

	describe('events', () => {
		// TextField should not receive change event after setting value.
		it.ios('change event should not fire after setting textField value', function (finish) {
			this.timeout(5000);

			win = Ti.UI.createWindow();
			const textField = Ti.UI.createTextField({
				value: 123
			});
			textField.addEventListener('change', function () {
				// This should never happen.
				finish(new Error('TextField wrongly received change on setting value.'));
			});
			win.add(textField);
			win.addEventListener('postlayout', function listener () {
				win.removeEventListener('postlayout', listener);
				// If we made it this far, assume TextField did not receive change.
				finish();
			});
			win.open();
		});

		// Tests adding and removing a TextField's focus.
		it.ios('focus-blur', function (finish) {
			this.timeout(5000);
			win = Ti.UI.createWindow({ layout: 'vertical' });

			// First TextField is needed to receive default focus on startup
			// and to receive focus when second TextField has lost focus.
			let textField = Ti.UI.createTextField({
				width: Ti.UI.FILL,
				height: Ti.UI.SIZE,
			});
			win.add(textField);

			// Second TextField is used to test focus/blur handling.
			textField = Ti.UI.createTextField({
				width: Ti.UI.FILL,
				height: Ti.UI.SIZE,
			});
			textField.addEventListener('focus', function () {
				// Focus has been received. Now test removing focus.
				setTimeout(() => textField.blur(), 500);
			});
			textField.addEventListener('blur', function () {
				// Focus has been lost. The test was finished successfully. (Timeout means failure.)
				finish();
			});
			win.add(textField);

			// Start the test when the window has been opened.
			win.addEventListener('postlayout', function listener () {
				win.removeEventListener('postlayout', listener);

				setTimeout(() => textField.focus(), 500);
			});
			win.open();
		});

		// TextField must not receive focus by default upon opening a window.
		it('focus-win-open', function (finish) {
			this.timeout(5000);

			win = Ti.UI.createWindow();
			const textField = Ti.UI.createTextField();
			textField.addEventListener('focus', function () {
				// This should never happen.
				finish(new Error('TextField wrongly received focus on open.'));
			});
			win.add(textField);
			win.addEventListener('postlayout', function listener () {
				win.removeEventListener('postlayout', listener);
				// If we made it this far, assume TextField did not receive focus.
				finish();
			});
			win.open();
		});

		// The "focus" and "blur" events are not supposed to bubble up the view hierarchy.
		// Windows ticket TIMOB-26177
		// Android intermittently fails (but quite often)
		it.androidAndWindowsBroken('focus-blur-bubbles', function (finish) {
			this.timeout(5000);

			win = Ti.UI.createWindow();
			const textField = Ti.UI.createTextField();
			textField.addEventListener('focus', function (e) {
				try {
					should(e.bubbles).be.be.false();
					textField.blur();
				} catch (err) {
					return finish(err);
				}
			});
			textField.addEventListener('blur', function (e) {
				try {
					should(e.bubbles).be.be.false();
				} catch (err) {
					return finish(err);
				}
				finish();
			});
			win.add(textField);
			win.addEventListener('open', () => textField.focus());
			win.open();
		});
	});
});
