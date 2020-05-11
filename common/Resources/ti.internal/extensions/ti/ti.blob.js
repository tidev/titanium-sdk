/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2019 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

if (Ti.Platform.osname === 'iphone' || Ti.Platform.osname === 'ipad') {
	const buffer = Ti.createBuffer({ value: '' });
	const blob = buffer.toBlob();
	if (blob) {
		blob.constructor.prototype.toString = function () {
			const value = this.text;
			return (value === undefined) ? '[object TiBlob]' :  value;
		};

		if ((parseInt(Ti.Platform.version.split('.')[0]) < 11)) {
			// This is hack to fix TIMOB-27707. Remove it after minimum target set iOS 11+
			setTimeout(function () {}, Infinity);
		}
	}
}
