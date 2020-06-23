/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';

describe('Titanium.UI.Window', () => {
	it('TIMOB-27711 will not open if close() called immediately after', function (finish) {
		const win = Ti.UI.createWindow({
			backgroundColor: '#0000ff'
		});
		win.addEventListener('open', _e => {
			setTimeout(() => win.close(), 1); // close it after we fail
			finish(new Error('Expect window to never open if we call open and then close immediately!'));
		});
		win.open();
		win.close();
		// wait until a window should have opened and fired the event...
		setTimeout(() => {
			finish();
		}, 1000);
		// locally android took 106,67,64ms
		// ios took 1ms repeatedly
		// so 1 second should be enough time.
	});
});
