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

describe('Titanium.App', function () {
	it.ios('Multiple global event listeners (TIMOB-25836)', function (finish) {
		function functionA () {
			Ti.App.removeEventListener('TestCheckNetwork', functionA);
		}

		function functionB () {
			Ti.App.removeEventListener('TestCheckNetwork', functionB);
			finish();
		}

		Ti.App.addEventListener('TestCheckNetwork', functionA);
		Ti.App.addEventListener('TestCheckNetwork', functionB);
		Ti.App.fireEvent('TestCheckNetwork');
	});
});
