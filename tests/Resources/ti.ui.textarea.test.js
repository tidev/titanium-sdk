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

const isCI = Ti.App.Properties.getBool('isCI', false);

describe('Titanium.UI.TextArea', () => {
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
				const textField = Ti.UI.createTextArea({});
				should(textField).have.readOnlyProperty('apiName').which.is.a.String();
			});

			it('equals \'Ti.UI.TextField\'', () => {
				const textField = Ti.UI.createTextArea({});
				should(textField.apiName).be.eql('Ti.UI.TextArea');
			});
		});

		describe('.backgroundColor', () => {
			let textArea;
			beforeEach(() => {
				textArea = Ti.UI.createTextArea({ backgroundColor: 'red' });
			});

			it('is a String', () => {
				should(textArea).have.property('backgroundColor').which.is.a.String();
			});

			it('equals value passed to factory method', () => {
				should(textArea.backgroundColor).eql('red');
			});

			it('can be assigned a String value', () => {
				textArea.backgroundColor = 'blue';
				should(textArea.backgroundColor).eql('blue');
			});

			it('has no accessors', () => {
				should(textArea).not.have.accessors('backgroundColor');
			});
		});

		describe('.editable', () => {
			let textArea;
			beforeEach(() => {
				textArea = Ti.UI.createTextArea();
			});

			it('is a Boolean', () => {
				should(textArea.editable).be.a.Boolean();
			});

			it('defaults to true', () => {
				should(textArea.editable).be.true();
			});

			it('can be assigned a Boolean value', () => {
				textArea.editable = false;
				should(textArea.editable).be.false();
			});

			it('has no accessors', () => {
				should(textArea).not.have.accessors('editable');
			});
		});

		describe('.enableCopy', () => {
			it('is a Boolean', () => {
				const textArea = Ti.UI.createTextArea();
				should(textArea).have.readOnlyProperty('enableCopy').which.is.a.Boolean();
			});

			it('defaults to true', () => {
				const textArea = Ti.UI.createTextArea();
				should(textArea.enableCopy).be.true();
			});

			it('can be initialized false', () => {
				const textArea = Ti.UI.createTextArea({ enableCopy: false });
				should(textArea.enableCopy).be.false();
			});

			it('can be changed dynamically', (finish) => {
				const textArea = Ti.UI.createTextArea();
				win = Ti.UI.createWindow({ backgroundColor: '#fff' });
				win.add(textArea);
				win.addEventListener('postlayout', function listener() {
					try {
						win.removeEventListener('postlayout', listener);
						textArea.enableCopy = false;
						should(textArea.enableCopy).be.false();
						finish();
					} catch (err) {
						finish(err);
					}
				});
				win.open();
			});
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
				textarea.focused.should.be.false(); // haven't opened it yet, so shouldn't be focused
				textarea.addEventListener('focus', () => {
					console.log('textarea focus event, closing window...');
					try {
						textarea.focused.should.be.true();
					} catch (e) {
						return done(e);
					}
					win.close();
				});
				win.addEventListener('open', () => {
					console.log('open event, forcing focus...');
					textarea.focus(); // force focus!
				});
				win.addEventListener('close', () => {
					console.log('window close event');
					try {
						// we've been closed (or are closing?) so hopefully shouldn't say that we're focused
						textarea.focused.should.be.false();
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

		describe.android('.lines', () => {
			let textArea;
			beforeEach(() => {
				textArea = Ti.UI.createTextArea({
					lines: 1,
					maxLines: 5
				});
			});

			it('is a Number', () => {
				should(textArea.lines).be.a.Number();
			});

			it('equals value passed to factory method', () => {
				should(textArea.lines).eql(1);
			});

			it('can be assigned an Integer value', () => {
				textArea.lines = 2;
				should(textArea.lines).eql(2);
			});

			it('has no accessors', () => {
				should(textArea).not.have.accessors('lines');
			});
		});

		describe.android('.maxLines', () => {
			let textArea;
			beforeEach(() => {
				textArea = Ti.UI.createTextArea({
					lines: 1,
					maxLines: 5
				});
			});

			it('is a Number', () => {
				should(textArea.maxLines).be.a.Number();
			});

			it('equals value passed to factory method', () => {
				should(textArea.maxLines).eql(5);
			});

			it('can be assigned an Integer value', () => {
				textArea.maxLines = 6;
				should(textArea.maxLines).eql(6);
			});

			it('has no accessors', () => {
				should(textArea).not.have.accessors('maxLines');
			});
		});

		describe.windowsMissing('.padding', () => {
			let textArea;
			beforeEach(() => {
				textArea = Ti.UI.createTextArea({
					value: 'this is some text',
					padding: {
						left: 20,
						right: 20
					}
				});
			});

			it('is an Object', () => {
				should(textArea).have.property('padding').which.is.an.Object();
			});

			it('equals value passed to factory method', () => {
				should(textArea.padding.left).eql(20);
				should(textArea.padding.right).eql(20);
			});

			it('can be assigned an Object value', () => {
				textArea.padding = {
					left: 10,
					right: 10
				};

				should(textArea.padding.left).eql(10);
				should(textArea.padding.right).eql(10);
			});

			it('has no accessors', () => {
				should(textArea).not.have.accessors('padding');
			});
		});

		describe.ios('.scrollsToTop', () => {
			let textArea;
			beforeEach(() => {
				textArea = Ti.UI.createTextArea();
			});

			it('is a Boolean', () => {
				should(textArea.scrollsToTop).be.a.Boolean();
			});

			it('defaults to true', () => {
				should(textArea.scrollsToTop).be.true();
			});

			it('can be assigned a Boolean value', () => {
				textArea.scrollsToTop = false;
				should(textArea.scrollsToTop).be.false();
			});

			it('has no accessors', () => {
				should(textArea).not.have.accessors('scrollsToTop');
			});
		});

		describe('.textAlign', () => {
			let textArea;
			beforeEach(() => {
				textArea = Ti.UI.createTextArea({
					value: 'this is some text',
					textAlign: Titanium.UI.TEXT_ALIGNMENT_CENTER
				});
			});

			// TODO: Check default is left!

			it('is a String on Android, Number on iOS', () => {
				// FIXME Parity issue!
				if (utilities.isAndroid()) {
					should(textArea.textAlign).be.a.String();
				} else {
					should(textArea.textAlign).be.a.Number();
				}
			});

			it('equals value passed to factory method', () => {
				should(textArea.textAlign).eql(Titanium.UI.TEXT_ALIGNMENT_CENTER);
			});

			it('can be assigned a constant value', () => {
				textArea.textAlign = Titanium.UI.TEXT_ALIGNMENT_RIGHT;
				should(textArea.textAlign).eql(Titanium.UI.TEXT_ALIGNMENT_RIGHT);
			});

			it('has no accessors', () => {
				should(textArea).not.have.accessors('textAlign');
			});
		});

		describe('.value', () => {
			let textArea;
			beforeEach(() => {
				textArea = Ti.UI.createTextArea({
					value: 'this is some text'
				});
			});

			it('is a String', () => {
				should(textArea.value).be.a.String();
			});

			it('equals value passed to factory method', () => {
				should(textArea.value).eql('this is some text');
			});

			it('can be assigned a String value', () => {
				textArea.value = 'other text';
				should(textArea.value).eql('other text');
			});

			it('has no accessors', () => {
				should(textArea).not.have.accessors('value');
			});
		});

		// FIXME: test was pegged to ios, but docs say Android-only!
		describe.android('.verticalAlign', () => {
			let textArea;
			beforeEach(() => {
				textArea = Ti.UI.createTextArea({
					value: 'this is some text',
					verticalAlign: Ti.UI.TEXT_VERTICAL_ALIGNMENT_BOTTOM
				});
			});

			it('is a String', () => {
				should(textArea.verticalAlign).be.a.String();
			});

			it('equals value passed to factory method', () => {
				should(textArea.verticalAlign).eql(Titanium.UI.TEXT_VERTICAL_ALIGNMENT_BOTTOM);
			});

			it('can be assigned a constant value', () => {
				textArea.verticalAlign = Titanium.UI.TEXT_VERTICAL_ALIGNMENT_TOP;
				should(textArea.verticalAlign).eql(Titanium.UI.TEXT_VERTICAL_ALIGNMENT_TOP);
			});

			it('has no accessors', () => {
				should(textArea).not.have.accessors('verticalAlign');
			});
		});
	});

	// Tests adding and removing a TextArea's focus.
	it.ios('focus-blur', function (finish) {
		this.timeout(5000);
		win = Ti.UI.createWindow({ layout: 'vertical' });

		// First TextArea is needed to receive default focus on startup
		// and to receive focus when second TextArea has lost focus.
		let textArea = Ti.UI.createTextArea({
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

	// Tests adding and removing a TextArea's focus.
	it('textArea in tabGroup', function (finish) {
		if (isCI && utilities.isMacOS()) { // FIXME: On macOS CI (maybe < 10.15.6?), times out! Does app need explicit focus added?
			return finish(); // FIXME: skip when we move to official mocha package
		}

		this.timeout(7500);

		const windowA = Ti.UI.createWindow();
		const tabA = Ti.UI.createTab({
			window: windowA,
			title: 'Tab A'
		});

		const windowB = Ti.UI.createWindow();
		const tabB = Ti.UI.createTab({
			window: windowB,
			title: 'Tab B'
		});

		const tabGroup = Titanium.UI.createTabGroup({
			tabs: [ tabA, tabB ]
		});

		windowA.addEventListener('open', function () {
			const subwin = Ti.UI.createWindow({ backgroundColor: 'blue' });

			subwin.addEventListener('open', function () {
				try {
					subwin.close();
					tabGroup.close();
				} catch (err) {
					return finish(err);
				}
				finish();
			});

			const typingView = Ti.UI.createView();
			const keyboardMessageView = Ti.UI.createView();
			const keyboardMessage = Ti.UI.createTextArea();

			keyboardMessageView.add(keyboardMessage);
			typingView.add(keyboardMessageView);
			subwin.add(typingView);

			setTimeout(() => tabA.open(subwin), 1000);
		});

		tabGroup.open();
	});
});
