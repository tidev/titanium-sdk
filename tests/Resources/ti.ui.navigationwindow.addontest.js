/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2017-Present by Axway. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';

describe.windowsMissing('Titanium.UI.NavigationWindow', _ => {
	let nav;

	this.timeout(10000);

	afterEach(function () {
		if (nav) {
			nav.close();
		}
		nav = null;
	});

	it('open/close events', finish => {
        const window = Ti.UI.createWindow();
        
		nav = Ti.UI.createNavigationWindow({
            window: window
        });

		nav.addEventListener('open', _ => {
			navigation.close();
		});
		nav.addEventListener('close', _ => {
			finish();
        });

		nav.open();
	});
});
