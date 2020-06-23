// TODO: Test some of the weirdness I'm seeing in Android:
// - Does Ti.UI.TabGroup fire a close event when closed?
// - Does Ti.UI.Window?
// - Is there a Ti.Android.TiActivityWindow proxy that does? What the hell?
// - Does the new closed property indicate true/false as we'd expect prior to calling open/inside open event listener/in close event listener/ after close returns?

/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
require('./utilities/assertions');

describe('Titanium.UI', function () {
	this.slow(2000);
	this.timeout(5000);

	let win;
	afterEach(done => { // fires after every test in sub-suites too...
		if (win && !win.closed) {
			win.addEventListener('close', function listener() {
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

	describe('Window', () => {
		beforeEach(() => {
			win = Ti.UI.createWindow();
		});

		it('.closed', done => {
			win.closed.should.eql(true); // it's not yet opened, so treat as closed
			win.addEventListener('open', () => {
				win.closed.should.eql(false); // we're being notified the window is open, so should report closed as false!
				done();
			});
			win.open();
			win.closed.should.eql(false); // should be open now
		});

		it('fires close event', done => {
			win.addEventListener('open', () => {
				win.close();
			});
			win.addEventListener('close', () => {
				win.closed.should.eql(true); // we're being notified the window is open, so should report closed as false!
				done();
			});
			win.open();
		});

		it('.focused', done => {
			win.focused.should.eql(false); // haven't opened it yet, so shouldn't be focused
			win.addEventListener('focus', () => {
				win.focused.should.eql(true);
				win.close();
			});
			win.addEventListener('close', () => {
				// we've been closed (or are closing?) so hopefully shouldn't say that we're focused
				win.focused.should.eql(false);
				done();
			});
			win.open();
		});	// For reference, Android fires open event and then focus event
	});

	describe('TabGroup', () => {
		beforeEach(() => {
			win = Ti.UI.createTabGroup();
			const tab = Ti.UI.createTab({
				title: 'Tab',
				window: Ti.UI.createWindow()
			});
			win.addTab(tab);
		});

		it('.closed', done => {
			win.closed.should.eql(true); // it's not yet opened, so treat as closed
			win.addEventListener('open', () => {
				win.closed.should.eql(false); // we're being notified the window is open, so should report closed as false!
				done();
			});
			win.open();
			win.closed.should.eql(false); // should be open now
		});

		it('fires close event', done => {
			win.addEventListener('open', () => {
				win.close();
			});
			win.addEventListener('close', () => {
				win.closed.should.eql(true); // we're being notified the window is open, so should report closed as false!
				done();
			});
			win.open();
		});

		it('.focused', done => {
			win.focused.should.eql(false); // haven't opened it yet, so shouldn't be focused
			// NOTE: I had to modify iOS' TabGroup implementation so that the focus event fired within the same timeline as Window's
			// The previous impl actually fired the focus event while the window was still opening, so a focus event listener
			// would have seen the TabGroup report itself as not opened or focused yet!
			win.addEventListener('focus', () => {
				try {
					win.focused.should.eql(true);
					win.close();
				} catch (e) {
					return done(e);
				}
			});
			win.addEventListener('close', () => {
				try {
					// we've been closed (or are closing?) so hopefully shouldn't say that we're focused
					win.focused.should.eql(false);
				} catch (e) {
					return done(e);
				}
				done();
			});
			win.open();
		});
	});

	// TODO: Test order we receive these things: open method return, open event fires, close method returns, close event fires?
	// Note that I fixed iOS so that they go in that order to match Android.

	describe('TextField', () => {
		let textfield;
		beforeEach(() => {
			win = Ti.UI.createWindow({ backgroundColor: '#fff' });
			textfield = Ti.UI.createTextField({
				backgroundColor: '#fafafa',
				color: 'green',
				width: 250,
				height: 40
			});
			win.add(textfield);
		});

		it('.focused', done => {
			try {
				textfield.should.have.a.property('focused').which.is.a.Boolean;
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
	});

	describe('TextArea', () => {
		let textarea;
		beforeEach(() => {
			win = Ti.UI.createWindow({ backgroundColor: '#fff' });
			textarea = Ti.UI.createTextArea({
				backgroundColor: '#fafafa',
				color: 'green',
				width: 250,
				height: 40
			});
			win.add(textarea);
		});

		it('.focused', done => {
			try {
				textarea.should.have.a.property('focused').which.is.a.Boolean;
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

	describe('SearchBar', () => {
		let searchbar;
		beforeEach(() => {
			win = Ti.UI.createWindow({ backgroundColor: '#fff' });
			searchbar = Ti.UI.createSearchBar({
				backgroundColor: '#fafafa',
				color: 'green',
				width: 250,
				height: 40
			});
			win.add(searchbar);
		});

		it('.focused', done => {
			try {
				searchbar.should.have.a.property('focused').which.is.a.Boolean;
				searchbar.focused.should.eql(false); // haven't opened it yet, so shouldn't be focused
				searchbar.addEventListener('focus', () => {
					try {
						searchbar.focused.should.eql(true);
					} catch (e) {
						return done(e);
					}
					win.close();
				});
				win.addEventListener('open', () => {
					searchbar.focus(); // force focus!
				});
				win.addEventListener('close', () => {
					try {
						// we've been closed (or are closing?) so hopefully shouldn't say that we're focused
						searchbar.focused.should.eql(false);
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
});
