/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2019-2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* globals OS_IOS, OS_VERSION_MAJOR */

if (OS_IOS) {
	const buffer = Ti.createBuffer({ value: '' });
	const blob = buffer.toBlob();
	blob.constructor.prototype.toString = function () {
		const value = this.text;
		return (value === undefined) ? '[object TiBlob]' :  value;
	};

	if (OS_VERSION_MAJOR < 11) {
		// This is hack to fix TIMOB-27707. Remove it after minimum target set iOS 11+
		setTimeout(function () {}, Infinity);
	}
}
