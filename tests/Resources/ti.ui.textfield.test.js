/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
var should = require('./utilities/assertions'),
	utilities = require('./utilities/utilities'),
	didFocus = false;

describe('Titanium.UI.TextField', function () {

	beforeEach(function() {
		didFocus = false;
	});

	it('apiName', function () {
		var textField = Ti.UI.createTextField({
			value: 'this is some text'
		});
		should(textField).have.readOnlyProperty('apiName').which.is.a.String;
		should(textField.apiName).be.eql('Ti.UI.TextField');
	});

	it('value', function () {
		var textfield = Ti.UI.createTextField({
			value: 'this is some text'
		});
		should(textfield.value).be.a.String;
		should(textfield.getValue).be.a.Function;
		should(textfield.value).eql('this is some text');
		should(textfield.getValue()).eql('this is some text');
		textfield.value = 'other text';
		should(textfield.value).eql('other text');
		should(textfield.getValue()).eql('other text');
	});

	// Skip on Windows Phone since not available, yet
	(!(utilities.isIOS() || utilities.isAndroid()) ? it.skip : it)('padding', function () {
		var textfield = Ti.UI.createTextField({
			value: 'this is some text',
			padding: {
				left: 20,
				right: 20
			}
		});
		should(textfield.padding).be.a.Object;
		should(textfield.getPadding).be.a.Function;
		should(textfield.setPadding).be.a.Function;

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
		var textfield = Ti.UI.createTextField({
			value: 'this is some text',
			textAlign: Titanium.UI.TEXT_ALIGNMENT_CENTER
		});
		if (utilities.isAndroid()) {
			should(textfield.textAlign).be.a.String;
		} else {
			should(textfield.textAlign).be.a.Number;
		}
		should(textfield.getTextAlign).be.a.Function;
		should(textfield.textAlign).eql(Titanium.UI.TEXT_ALIGNMENT_CENTER);
		should(textfield.getTextAlign()).eql(Titanium.UI.TEXT_ALIGNMENT_CENTER);
		textfield.textAlign = Titanium.UI.TEXT_ALIGNMENT_RIGHT;
		should(textfield.textAlign).eql(Titanium.UI.TEXT_ALIGNMENT_RIGHT);
		should(textfield.getTextAlign()).eql(Titanium.UI.TEXT_ALIGNMENT_RIGHT);
	});

	it('verticalAlign', function () {
		var textfield = Ti.UI.createTextField({
			value: 'this is some text',
			verticalAlign: Titanium.UI.TEXT_VERTICAL_ALIGNMENT_BOTTOM
		});
		if (utilities.isAndroid()) {
			should(textfield.verticalAlign).be.a.String;
		} else {
			should(textfield.verticalAlign).be.a.Number;
		}
		should(textfield.getVerticalAlign).be.a.Function;
		should(textfield.verticalAlign).eql(Titanium.UI.TEXT_VERTICAL_ALIGNMENT_BOTTOM);
		should(textfield.getVerticalAlign()).eql(Titanium.UI.TEXT_VERTICAL_ALIGNMENT_BOTTOM);
		textfield.verticalAlign = Titanium.UI.TEXT_VERTICAL_ALIGNMENT_TOP;
		should(textfield.verticalAlign).eql(Titanium.UI.TEXT_VERTICAL_ALIGNMENT_TOP);
		should(textfield.getVerticalAlign()).eql(Titanium.UI.TEXT_VERTICAL_ALIGNMENT_TOP);
	});

	// FIXME Defaults to undefined on Android. Docs say default is false
	(utilities.isAndroid() ? it.skip : it)('passwordMask', function () {
		var text = 'this is some text',
			textfield = Ti.UI.createTextField({
				value: text
			});
		// passwordMask should default to false
		should(textfield.passwordMask).be.false; // undefined on Android
		textfield.passwordMask = true;
		should(textfield.passwordMask).be.true;
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
		var textfield = Ti.UI.createTextField({
			hintText: 'Enter E-Mail ...'
		});
		should(textfield.getHintText).be.a.Function;
		should(textfield.hintText).eql('Enter E-Mail ...');
		should(textfield.getHintText()).eql('Enter E-Mail ...');
		textfield.hintText = 'Enter Name ...';
		should(textfield.hintText).eql('Enter Name ...');
		should(textfield.getHintText()).eql('Enter Name ...');
	});

	it('hintTextColor', function () {
		var textfield = Ti.UI.createTextField({
			hintText: 'Enter E-Mail ...',
			hintTextColor: 'red'
		});
		should(textfield.getHintTextColor).be.a.Function;
		should(textfield.hintTextColor).eql('red');
		should(textfield.getHintTextColor()).eql('red');
		textfield.hintTextColor = 'blue';
		should(textfield.hintTextColor).eql('blue');
		should(textfield.getHintTextColor()).eql('blue');
	});

	(utilities.isIOS() ? it.skip : it)('hintType', function () {
		var textfield = Ti.UI.createTextField({
			hintText: 'Enter E-Mail ...',
			hintType: Ti.UI.HINT_TYPE_ANIMATED
		});
		should(textfield.getHintType).be.a.Function;
		should(textfield.hintType).eql(Ti.UI.HINT_TYPE_ANIMATED);
		should(textfield.getHintType()).eql(Ti.UI.HINT_TYPE_ANIMATED);
		textfield.hintType = Ti.UI.HINT_TYPE_STATIC;
		should(textfield.hintType).eql(Ti.UI.HINT_TYPE_STATIC);
		should(textfield.getHintType()).eql(Ti.UI.HINT_TYPE_STATIC);
	});

	it.skip('width', function (finish) {
		this.timeout(5000);
		var textfield = Ti.UI.createTextField({
			value: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec nec ullamcorper massa, eget tempor sapien. Phasellus nisi metus, tempus a magna nec, ultricies rutrum lacus. Aliquam sit amet augue suscipit, dignissim tellus eu, consectetur elit. Praesent ligula velit, blandit vel urna sit amet, suscipit euismod nunc.',
			width: Ti.UI.SIZE
		});
		var win = Ti.UI.createWindow({
			backgroundColor: '#ddd'
		});
		win.add(textfield);
		win.addEventListener('focus', function () {
			var error;

			try {
				should(win.width).be.greaterThan(100);
				should(textfield.width).not.be.greaterThan(win.width);
			} catch (err) {
				error = err;
			}

			setTimeout(function() {
				win.close();
				finish(error);
			}, 3000);
		});
		win.open();
	});

	// FIXME Intermittently failing on Android on build machine, I think due to test timeout
	(utilities.isAndroid() ? it.skip : it)('height', function (finish) {
		this.timeout(5000);
		var textfield = Ti.UI.createTextField({
				value: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec nec ullamcorper massa, eget tempor sapien. Phasellus nisi metus, tempus a magna nec, ultricies rutrum lacus. Aliquam sit amet augue suscipit, dignissim tellus eu, consectetur elit. Praesent ligula velit, blandit vel urna sit amet, suscipit euismod nunc.',
				width: Ti.UI.SIZE,
				height: Ti.UI.SIZE,
				color: 'black'
			}),
			bgView = Ti.UI.createView({
				width: 200,
				height: 100,
				backgroundColor: 'red'
			}),
			win = Ti.UI.createWindow({
				backgroundColor: '#eee'
			});
		bgView.add(textfield);
		win.add(bgView);

		win.addEventListener('focus', function () {
			var error;

			if (didFocus) return;
			didFocus = true;

			try {
				should(bgView.height).be.eql(100);
				should(textfield.height).not.be.greaterThan(100);
			} catch (err) {
				error = err;
			}

			setTimeout(function() {
				win.close();
				finish(error);
			}, 3000);
		});
		win.open();
	});

});
