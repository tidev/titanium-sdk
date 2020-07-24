/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env titanium, mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');
const utilities = require('./utilities/utilities');

describe('Titanium.UI.TextField', function () {
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

	it('apiName', function () {
		const textField = Ti.UI.createTextField({
			value: 'this is some text'
		});
		should(textField).have.readOnlyProperty('apiName').which.is.a.String();
		should(textField.apiName).be.eql('Ti.UI.TextField');
	});

	it('value', function () {
		const textfield = Ti.UI.createTextField({
			value: 'this is some text'
		});
		should(textfield.value).be.a.String();
		should(textfield.getValue).be.a.Function();
		should(textfield.value).eql('this is some text');
		should(textfield.getValue()).eql('this is some text');
		textfield.value = 'other text';
		should(textfield.value).eql('other text');
		should(textfield.getValue()).eql('other text');
	});

	// Skip on Windows Phone since not available, yet
	it.windowsMissing('padding', function () {
		const textfield = Ti.UI.createTextField({
			value: 'this is some text',
			padding: {
				left: 20,
				right: 20
			}
		});
		should(textfield.padding).be.a.Object();
		should(textfield.getPadding).be.a.Function();
		should(textfield.setPadding).be.a.Function();

		should(textfield.padding.left).eql(20);
		should(textfield.padding.right).eql(20);
		should(textfield.getPadding().left).eql(20);
		should(textfield.getPadding().right).eql(20);

		textfield.setPadding({
			left: 10,
			right: 10
		});

		should(textfield.padding.left).eql(10);
		should(textfield.padding.right).eql(10);
		should(textfield.getPadding().left).eql(10);
		should(textfield.getPadding().right).eql(10);
	});

	it('textAlign', function () {
		const textfield = Ti.UI.createTextField({
			value: 'this is some text',
			textAlign: Titanium.UI.TEXT_ALIGNMENT_CENTER
		});
		// FIXME Parity issue!
		if (utilities.isAndroid()) {
			should(textfield.textAlign).be.a.String();
		} else {
			should(textfield.textAlign).be.a.Number();
		}
		should(textfield.getTextAlign).be.a.Function();
		should(textfield.textAlign).eql(Titanium.UI.TEXT_ALIGNMENT_CENTER);
		should(textfield.getTextAlign()).eql(Titanium.UI.TEXT_ALIGNMENT_CENTER);
		textfield.textAlign = Titanium.UI.TEXT_ALIGNMENT_RIGHT;
		should(textfield.textAlign).eql(Titanium.UI.TEXT_ALIGNMENT_RIGHT);
		should(textfield.getTextAlign()).eql(Titanium.UI.TEXT_ALIGNMENT_RIGHT);
	});

	it('verticalAlign', function () {
		const textfield = Ti.UI.createTextField({
			value: 'this is some text',
			verticalAlign: Titanium.UI.TEXT_VERTICAL_ALIGNMENT_BOTTOM
		});
		// FIXME Parity issue!
		if (utilities.isAndroid()) {
			should(textfield.verticalAlign).be.a.String();
		} else {
			should(textfield.verticalAlign).be.a.Number();
		}
		should(textfield.getVerticalAlign).be.a.Function();
		should(textfield.verticalAlign).eql(Titanium.UI.TEXT_VERTICAL_ALIGNMENT_BOTTOM);
		should(textfield.getVerticalAlign()).eql(Titanium.UI.TEXT_VERTICAL_ALIGNMENT_BOTTOM);
		textfield.verticalAlign = Titanium.UI.TEXT_VERTICAL_ALIGNMENT_TOP;
		should(textfield.verticalAlign).eql(Titanium.UI.TEXT_VERTICAL_ALIGNMENT_TOP);
		should(textfield.getVerticalAlign()).eql(Titanium.UI.TEXT_VERTICAL_ALIGNMENT_TOP);
	});

	// FIXME Defaults to undefined on Android. Docs say default is false
	it.androidBroken('passwordMask', function () {
		const text = 'this is some text',
			textfield = Ti.UI.createTextField({
				value: text
			});
		// passwordMask should default to false
		should(textfield.passwordMask).be.false(); // undefined on Android
		textfield.passwordMask = true;
		should(textfield.passwordMask).be.true();
		// it should have same text before
		should(textfield.value).be.eql(text);
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

	it('hintText', function () {
		const textfield = Ti.UI.createTextField({
			hintText: 'Enter E-Mail ...'
		});
		should(textfield.getHintText).be.a.Function();
		should(textfield.hintText).eql('Enter E-Mail ...');
		should(textfield.getHintText()).eql('Enter E-Mail ...');
		textfield.hintText = 'Enter Name ...';
		should(textfield.hintText).eql('Enter Name ...');
		should(textfield.getHintText()).eql('Enter Name ...');
	});

	it.windowsMissing('hintTextColor', function () {
		const textfield = Ti.UI.createTextField({
			hintText: 'Enter E-Mail ...',
			hintTextColor: 'red'
		});
		should(textfield.getHintTextColor).be.a.Function();
		should(textfield.hintTextColor).eql('red');
		should(textfield.getHintTextColor()).eql('red');
		textfield.hintTextColor = 'blue';
		should(textfield.hintTextColor).eql('blue');
		should(textfield.getHintTextColor()).eql('blue');
	});

	it.android('hintType', function () {
		const textfield = Ti.UI.createTextField({
			hintText: 'Enter E-Mail ...',
			hintType: Ti.UI.HINT_TYPE_ANIMATED
		});
		should(textfield.getHintType).be.a.Function();
		should(textfield.hintType).eql(Ti.UI.HINT_TYPE_ANIMATED);
		should(textfield.getHintType()).eql(Ti.UI.HINT_TYPE_ANIMATED);
		textfield.hintType = Ti.UI.HINT_TYPE_STATIC;
		should(textfield.hintType).eql(Ti.UI.HINT_TYPE_STATIC);
		should(textfield.getHintType()).eql(Ti.UI.HINT_TYPE_STATIC);
	});

	it('width', function (finish) {
		this.timeout(5000);
		const textfield = Ti.UI.createTextField({
			value: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec nec ullamcorper massa, eget tempor sapien. Phasellus nisi metus, tempus a magna nec, ultricies rutrum lacus. Aliquam sit amet augue suscipit, dignissim tellus eu, consectetur elit. Praesent ligula velit, blandit vel urna sit amet, suscipit euismod nunc.',
			width: Ti.UI.SIZE
		});
		win = Ti.UI.createWindow({
			backgroundColor: '#ddd'
		});
		win.add(textfield);
		win.addEventListener('postlayout', function listener () {
			win.removeEventListener('postlayout', listener);
			try {
				should(win.rect.width).be.greaterThan(100);
				should(textfield.rect.width).not.be.greaterThan(win.rect.width);
			} catch (err) {
				return finish(err);
			}
			finish();
		});
		win.open();
	});

	// FIXME Intermittently failing on Android on build machine, I think due to test timeout
	it.androidBroken('height', function (finish) {
		this.timeout(5000);
		const textfield = Ti.UI.createTextField({
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
		bgView.add(textfield);
		win.add(bgView);

		win.addEventListener('focus', function () {
			try {
				should(bgView.height).be.eql(100);
				should(textfield.height).not.be.greaterThan(100);
			} catch (err) {
				return finish(err);
			}
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
				should(e.bubbles).be.eql(false);
				textField.blur();
			} catch (err) {
				return finish(err);
			}
		});
		textField.addEventListener('blur', function (e) {
			try {
				should(e.bubbles).be.eql(false);
			} catch (err) {
				return finish(err);
			}
			finish();
		});
		win.add(textField);
		win.addEventListener('open', () => textField.focus());
		win.open();
	});

	it.ios('.passwordRules', function () {
		const textField = Ti.UI.createTextField({
			passwordMask: true,
			passwordRules: 'required: upper; required: lower; required: digit; max-consecutive: 2'
		});
		should(textField.passwordRules).equal('required: upper; required: lower; required: digit; max-consecutive: 2');
	});

	it.ios('#hasText()', function () {
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

		win.open();
	});

	it('.focused', done => {
		win = Ti.UI.createWindow({ backgroundColor: '#fff' });
		const textfield = Ti.UI.createTextField({
			backgroundColor: '#fafafa',
			color: 'green',
			width: 250,
			height: 40
		});
		win.add(textfield);
		try {
			textfield.should.have.a.property('focused').which.is.a.Boolean();
			textfield.focused.should.eql(false); // haven't opened it yet, so shouldn't be focused
			textfield.addEventListener('focus', () => {
				try {
					textfield.focused.should.eql(true);
				} catch (e) {
					return done(e);
				}
				win.close();
			});
			win.addEventListener('open', () => {
				textfield.focus(); // force focus!
			});
			win.addEventListener('close', () => {
				try {
					// we've been closed (or are closing?) so hopefully shouldn't say that we're focused
					textfield.focused.should.eql(false);
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
});
