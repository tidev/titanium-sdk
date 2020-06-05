/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2017-Present by Axway. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';

describe.windowsMissing('Titanium.UI.NavigationWindow', function () {
	let nav;

	this.timeout(10000);

	afterEach(() => {
		if (nav) {
			nav.close();
		}
		nav = null;
	});

	it('open/close events', finish => {
		const window = Ti.UI.createWindow();

		nav = Ti.UI.createNavigationWindow({ window });

		nav.addEventListener('open', () => nav.close());
		nav.addEventListener('close', () => finish());

		nav.open();
	});
});
