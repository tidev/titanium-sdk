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

describe.only('Ti.UI.Window', () => {
	let win;
	afterEach(done => {
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

	it('.closed', done => {
		win = Ti.UI.createWindow();
		win.closed.should.eql(true); // it's not yet opened, so treat as closed
		win.addEventListener('open', () => {
			win.closed.should.eql(false); // we're being notified the window is open, so should report closed as false!
			done();
		});
		win.open();
		win.closed.should.eql(false); // should be open now
	});

	// TODO: Verify that Ti.UI.Window and Ti.UI.TabeGroup fire close events!

	it('fires close event', done => {
		win = Ti.UI.createWindow();
		win.addEventListener('open', () => {
			console.log('open event');
			win.close();
			console.log('close method returned');
		});
		win.addEventListener('close', () => {
			console.log('close event');
			win.closed.should.eql(true); // we're being notified the window is open, so should report closed as false!
			done();
		});
		win.open();
		console.log('open method has returned');

		// Android we get: open method returns, open event, close methods returns, close event, test done
		// on iOS we get: open event, close event, test done, close method returns, open method returns
		// conclusion? iOS is sync, Android is not? Or android fires events async?

		// after tweaks, iOS: open method returns, open event, close method returns, close event, test done
	});

	// TODO: add focused property to Ti.UI.View and test it?
});
