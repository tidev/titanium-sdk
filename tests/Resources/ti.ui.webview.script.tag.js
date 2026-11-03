/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';

// eslint-disable-next-line no-unused-vars
function onPageLoaded() {
	setTimeout(function () {
		Ti.App.fireEvent('ti.ui.webview.script.tag:onPageLoaded', {});
	}, 1000);
}
