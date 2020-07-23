/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env titanium, mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Titanium.UI.TextArea', function () {
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
		var textArea = Ti.UI.createTextArea({
			value: 'this is some text'
		});
		should(textArea).have.readOnlyProperty('apiName').which.is.a.String();
		should(textArea.apiName).be.eql('Ti.UI.TextArea');
	});

	it('value', function () {
		var textArea = Ti.UI.createTextArea({
			value: 'this is some text'
		});
		should(textArea.value).be.a.String();
		should(textArea.getValue).be.a.Function();
		should(textArea.value).eql('this is some text');
		should(textArea.getValue()).eql('this is some text');
		textArea.value = 'other text';
		should(textArea.value).eql('other text');
		should(textArea.getValue()).eql('other text');
	});

	it('editable', function () {
		var textArea = Ti.UI.createTextArea();
		should(textArea.editable).be.a.Boolean();
		should(textArea.editable).be.true();
		textArea.setEditable(false);
		should(textArea.editable).be.false();
	});

	it.ios('scrollsToTop', function () {
		var textArea = Ti.UI.createTextArea();
		should(textArea.scrollsToTop).be.a.Boolean();
		should(textArea.scrollsToTop).be.true();
		textArea.setScrollsToTop(false);
		should(textArea.scrollsToTop).be.false();
	});

	it('backgroundColor', function () {
		var textArea = Ti.UI.createTextArea({ backgroundColor: 'red' });
		should(textArea.backgroundColor).be.a.String();
		should(textArea.backgroundColor).eql('red');
		textArea.setBackgroundColor('white');
		should(textArea.backgroundColor).eql('white');
	});

	it.windowsMissing('padding', function () {
		var textArea = Ti.UI.createTextArea({
			value: 'this is some text',
			padding: {
				left: 20,
				right: 20
			}
		});
		should(textArea.padding).be.a.Object();
		should(textArea.getPadding).be.a.Function();
		should(textArea.setPadding).be.a.Function();

		should(textArea.padding.left).eql(20);
		should(textArea.padding.right).eql(20);
		should(textArea.getPadding().left).eql(20);
		should(textArea.getPadding().right).eql(20);

		textArea.setPadding({
			left: 10,
			right: 10
		});

		should(textArea.padding.left).eql(10);
		should(textArea.padding.right).eql(10);
		should(textArea.getPadding().left).eql(10);
		should(textArea.getPadding().right).eql(10);
	});

	// Tests adding and removing a TextArea's focus.
	it.ios('focus-blur', function (finish) {
		var textArea;
		this.timeout(5000);
		win = Ti.UI.createWindow({ layout: 'vertical' });

		// First TextArea is needed to receive default focus on startup
		// and to receive focus when second TextArea has lost focus.
		textArea = Ti.UI.createTextArea({
			width: Ti.UI.FILL,
			height: Ti.UI.SIZE,
		});
		win.add(textArea);

		// Second TextArea is used to test focus/blur handling.
		textArea = Ti.UI.createTextArea({
			width: Ti.UI.FILL,
			height: Ti.UI.SIZE,
		});
		textArea.addEventListener('focus', function () {
			// Focus has been received. Now test removing focus.
			setTimeout(function () {
				textArea.blur();
			}, 500);
		});
		textArea.addEventListener('blur', function () {
			// Focus has been lost. The test was finished successfully. (Timeout means failure.)
			finish();
		});
		win.add(textArea);

		// Start the test when the window has been opened.
		win.addEventListener('postlayout', function () {
			setTimeout(function () {
				textArea.focus();
			}, 500);
		});
		win.open();
	});

	it.ios('textAlign', function () {
		var textArea = Ti.UI.createTextArea({
			value: 'this is some text',
			textAlign: Titanium.UI.TEXT_ALIGNMENT_CENTER
		});
		should(textArea.textAlign).be.a.Number();
		should(textArea.getTextAlign).be.a.Function();
		should(textArea.textAlign).eql(Titanium.UI.TEXT_ALIGNMENT_CENTER);
		should(textArea.getTextAlign()).eql(Titanium.UI.TEXT_ALIGNMENT_CENTER);
		textArea.textAlign = Titanium.UI.TEXT_ALIGNMENT_RIGHT;
		should(textArea.textAlign).eql(Titanium.UI.TEXT_ALIGNMENT_RIGHT);
		should(textArea.getTextAlign()).eql(Titanium.UI.TEXT_ALIGNMENT_RIGHT);
	});

	it.ios('verticalAlign', function () {
		var textArea = Ti.UI.createTextArea({
			value: 'this is some text',
			verticalAlign: Titanium.UI.TEXT_VERTICAL_ALIGNMENT_BOTTOM
		});
		should(textArea.verticalAlign).be.a.Number();
		should(textArea.getVerticalAlign).be.a.Function();
		should(textArea.verticalAlign).eql(Titanium.UI.TEXT_VERTICAL_ALIGNMENT_BOTTOM);
		should(textArea.getVerticalAlign()).eql(Titanium.UI.TEXT_VERTICAL_ALIGNMENT_BOTTOM);
		textArea.verticalAlign = Titanium.UI.TEXT_VERTICAL_ALIGNMENT_TOP;
		should(textArea.verticalAlign).eql(Titanium.UI.TEXT_VERTICAL_ALIGNMENT_TOP);
		should(textArea.getVerticalAlign()).eql(Titanium.UI.TEXT_VERTICAL_ALIGNMENT_TOP);
	});

	it.android('lines', function () {
		var textArea = Ti.UI.createTextArea({
			lines: 1,
			maxLines: 5
		});
		should(textArea.lines).be.a.Number();
		should(textArea.getLines).be.a.Function();
		should(textArea.maxLines).be.a.Number();
		should(textArea.getMaxLines).be.a.Function();
		should(textArea.getLines()).eql(1);
		should(textArea.maxLines).eql(5);
		textArea.lines = 2;
		textArea.setMaxLines(6);
		should(textArea.lines).eql(2);
		should(textArea.getMaxLines()).eql(6);
	});

	// Tests adding and removing a TextArea's focus.
	it('textArea in tabGroup', function (finish) {
		var windowA, windowB, tabA, tabB, tabGroup;

		this.timeout(7500);

		windowA = Ti.UI.createWindow();
		windowB = Ti.UI.createWindow();

		tabA = Ti.UI.createTab({
			window: windowA,
			title: 'Tab A'
		});

		tabB = Ti.UI.createTab({
			window: windowB,
			title: 'Tab B'
		});

		tabGroup = Titanium.UI.createTabGroup({
			tabs: [ tabA, tabB ]
		});

		windowA.addEventListener('open', function () {
			var subwin, typingView, keyboardMessageView, keyboardMessage;

			subwin = Ti.UI.createWindow({ backgroundColor: 'blue' });

			subwin.addEventListener('open', function () {
				subwin.close();
				tabGroup.close();
				finish();
			});

			typingView = Ti.UI.createView();
			keyboardMessageView = Ti.UI.createView();
			keyboardMessage = Ti.UI.createTextArea();

			keyboardMessageView.add(keyboardMessage);
			typingView.add(keyboardMessageView);
			subwin.add(typingView);

			setTimeout(function () {
				tabA.open(subwin);
			}, 1000);
		});

		tabGroup.open();
	});

	it('.focused', function (done) {
		this.slow(2000);
		this.timeout(5000);

		win = Ti.UI.createWindow({ backgroundColor: '#fff' });
		const textarea = Ti.UI.createTextArea({
			backgroundColor: '#fafafa',
			color: 'green',
			width: 250,
			height: 40
		});
		win.add(textarea);
		try {
			textarea.should.have.a.property('focused').which.is.a.Boolean();
			textarea.focused.should.eql(false); // haven't opened it yet, so shouldn't be focused
			textarea.addEventListener('focus', () => {
				try {
					textarea.focused.should.eql(true);
				} catch (e) {
					return done(e);
				}
				win.close();
			});
			win.addEventListener('open', () => {
				textarea.focus(); // force focus!
			});
			win.addEventListener('close', () => {
				try {
					// we've been closed (or are closing?) so hopefully shouldn't say that we're focused
					textarea.focused.should.eql(false);
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
});
