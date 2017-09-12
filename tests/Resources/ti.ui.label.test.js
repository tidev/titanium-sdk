/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions'),
	utilities = require('./utilities/utilities');

describe('Titanium.UI.Label', function () {
	var win,
		didPostLayout = false;

	beforeEach(function () {
		didPostLayout = false;
	});

	afterEach(function () {
		if (win) {
			win.close();
		}
		win = null;
	});

	it('apiName', function () {
		var label = Ti.UI.createLabel({
			text: 'this is some text'
		});
		should(label).have.readOnlyProperty('apiName').which.is.a.String;
		should(label.apiName).be.eql('Ti.UI.Label');
	});

	it('maxLines', function () {
		var label = Ti.UI.createLabel({
			text: 'This is a label with propably more than three lines of text. The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.',
			maxLines: 2
		});
		should(label.maxLines).be.a.Number;
		should(label.getMaxLines).be.a.Function;
		should(label.maxLines).eql(2);
		should(label.getMaxLines()).eql(2);
		label.maxLines = 1;
		should(label.maxLines).eql(1);
		should(label.getMaxLines()).eql(1);
	});

	it('text', function () {
		var label = Ti.UI.createLabel({
			text: 'this is some text'
		});
		should(label.text).be.a.String;
		should(label.getText).be.a.Function;
		should(label.text).eql('this is some text');
		should(label.getText()).eql('this is some text');
		label.text = 'other text';
		should(label.text).eql('other text');
		should(label.getText()).eql('other text');
	});

	it('textid', function () {
		var label = Ti.UI.createLabel({
			textid: 'this_is_my_key'
		});
		should(label.textid).be.a.String;
		should(label.getTextid).be.a.Function;
		should(label.textid).eql('this_is_my_key');
		should(label.getTextid()).eql('this_is_my_key');
		should(label.text).eql('this is my value');
		label.textid = 'other text';
		should(label.textid).eql('other text');
		should(label.getTextid()).eql('other text');
		should(label.text).eql('this is my value'); // Windows issue
	});

	it('textAlign', function () {
		var label = Ti.UI.createLabel({
			text: 'this is some text',
			textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER
		});
		if (utilities.isAndroid()) {
			should(label.textAlign).be.a.String;
		} else {
			should(label.textAlign).be.a.Number;
		}
		should(label.getTextAlign).be.a.Function;
		should(label.textAlign).eql(Ti.UI.TEXT_ALIGNMENT_CENTER);
		should(label.getTextAlign()).eql(Ti.UI.TEXT_ALIGNMENT_CENTER);
		label.textAlign = Ti.UI.TEXT_ALIGNMENT_RIGHT;
		should(label.textAlign).eql(Ti.UI.TEXT_ALIGNMENT_RIGHT);
		should(label.getTextAlign()).eql(Ti.UI.TEXT_ALIGNMENT_RIGHT);

		// TIMOB-3408
		if (utilities.isIOS()) {
			label.textAlign = Ti.UI.TEXT_ALIGNMENT_JUSTIFY;
			should(label.textAlign).eql(Ti.UI.TEXT_ALIGNMENT_JUSTIFY);
			should(label.getTextAlign()).eql(Ti.UI.TEXT_ALIGNMENT_JUSTIFY);
		}
	});

	it('verticalAlign', function () {
		var label = Ti.UI.createLabel({
			text: 'this is some text',
			verticalAlign: Ti.UI.TEXT_VERTICAL_ALIGNMENT_BOTTOM
		});
		if (utilities.isAndroid()) {
			should(label.verticalAlign).be.a.String;
		} else {
			should(label.verticalAlign).be.a.Number;
		}
		should(label.getVerticalAlign).be.a.Function;
		should(label.verticalAlign).eql(Ti.UI.TEXT_VERTICAL_ALIGNMENT_BOTTOM);
		should(label.getVerticalAlign()).eql(Ti.UI.TEXT_VERTICAL_ALIGNMENT_BOTTOM);
		label.verticalAlign = Ti.UI.TEXT_VERTICAL_ALIGNMENT_TOP;
		should(label.verticalAlign).eql(Ti.UI.TEXT_VERTICAL_ALIGNMENT_TOP);
		should(label.getVerticalAlign()).eql(Ti.UI.TEXT_VERTICAL_ALIGNMENT_TOP);
	});

	// set ellipsize in the label
	// Default: Ti.UI.TEXT_ELLIPSIZE_TRUNCATE_END
	it('ellipsize', function () {
		var label = Ti.UI.createLabel({
			text: 'this is some text'
		});
		should(label.ellipsize).be.a.Number;
		should(label.getEllipsize).be.a.Function;
		should(label.ellipsize).eql(Ti.UI.TEXT_ELLIPSIZE_TRUNCATE_END);
		should(label.getEllipsize()).eql(Ti.UI.TEXT_ELLIPSIZE_TRUNCATE_END);
		label.ellipsize = Ti.UI.TEXT_ELLIPSIZE_TRUNCATE_MIDDLE;
		should(label.getEllipsize()).eql(Ti.UI.TEXT_ELLIPSIZE_TRUNCATE_MIDDLE);
		should(label.ellipsize).eql(Ti.UI.TEXT_ELLIPSIZE_TRUNCATE_MIDDLE);
	});

	// Enable or disable word wrapping in the label.
	// Defaults: true
	// Intentionally skip on iOS, property not on platform.
	it.iosMissing('wordWrap', function () {
		var label = Ti.UI.createLabel({
			text: 'this is some text'
		});
		should(label.wordWrap).be.a.Boolean;
		should(label.getWordWrap).be.a.Function;
		should(label.wordWrap).eql(true);
		should(label.getWordWrap()).eql(true);
		label.wordWrap = false;
		should(label.getWordWrap()).eql(false);
		should(label.wordWrap).eql(false);
	});

	// FIXME Can't rely on Ti.UI.Window.postlayout event firing because neither platform fires it for that type (only maybe bubbles up from label)
	// Can we place the label inside a view?
	it.androidAndIosBroken('width', function (finish) {
		var label;
		this.slow(1000);
		this.timeout(10000);

		win = Ti.UI.createWindow({ backgroundColor: '#ddd' });

		label = Ti.UI.createLabel({
			text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec nec ullamcorper massa, eget tempor sapien. Phasellus nisi metus, tempus a magna nec, ultricies rutrum lacus. Aliquam sit amet augue suscipit, dignissim tellus eu, consectetur elit. Praesent ligula velit, blandit vel urna sit amet, suscipit euismod nunc.',
			width: Ti.UI.SIZE
		});
		win.add(label);
		win.addEventListener('postlayout', function () {
			if (didPostLayout) {
				return;
			}
			didPostLayout = true;

			try {
				should(label.size.width).not.be.greaterThan(win.size.width);

				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.open();
	});

	// FIXME Can't rely on Ti.UI.Window.postlayout event firing because neither platform fires it for that type (only maybe bubbles up from label)
	// Can we listen to it on bgView?
	it.androidAndIosBroken('height', function (finish) {
		var label,
			bgView;
		this.slow(1000);
		this.timeout(10000);

		win = Ti.UI.createWindow({ backgroundColor: '#eee' });

		label = Ti.UI.createLabel({
			text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec nec ullamcorper massa, eget tempor sapien. Phasellus nisi metus, tempus a magna nec, ultricies rutrum lacus. Aliquam sit amet augue suscipit, dignissim tellus eu, consectetur elit. Praesent ligula velit, blandit vel urna sit amet, suscipit euismod nunc.',
			width: Ti.UI.SIZE,
			height: Ti.UI.SIZE,
			color: 'black'
		});
		bgView = Ti.UI.createView({
			width: 200, height: 100,
			backgroundColor: 'red'
		});
		bgView.add(label);
		win.add(bgView);

		win.addEventListener('postlayout', function () {
			if (didPostLayout) {
				return;
			}
			didPostLayout = true;

			try {
				should(bgView.size.height).be.eql(100);

				// Uncomment below because it should be ok for label to have height greater than parent view
				// parent view should be able to handle which areas should be shown in that case.
				// should(label.size.height).not.be.greaterThan(100);

				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.open();
	});

	it('border (without width/height)', function (finish) {
		var win,
			label;
		this.timeout(3000);
		win = Ti.UI.createWindow();
		label = Ti.UI.createLabel({
			borderWidth: 5,
			borderColor: 'yellow',
			borderRadius: 5,
			text: 'this is some text'
		});
		win.addEventListener('open', function () {
			setTimeout(function () {
				should(label.size.width).be.greaterThan(0);
				should(label.size.height).be.greaterThan(0);
				win.close();
				finish();
			}, 1000);
		});
		win.add(label);
		win.open();
	});
});
