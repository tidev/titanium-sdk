/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2019 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

if (Ti.Platform.osname === 'iphone' || Ti.Platform.osname === 'ipad') {
	const buffer = Ti.createBuffer({ value: '' });
	const blob = buffer.toBlob();
	blob.constructor.prototype.toString = function () {
		return this.text;
	};
}
