/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2019-Present by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* globals OS_IOS, OS_VERSION_MAJOR */
const buffer = Ti.createBuffer({ value: '' });
const blob = buffer.toBlob();

if (OS_IOS) {
	blob.constructor.prototype.toString = function () {
		const value = this.text;
		return (value === undefined) ? '[object TiBlob]' :  value;
	};

	if (OS_VERSION_MAJOR < 11) {
		// This is hack to fix TIMOB-27707. Remove it after minimum target set iOS 11+
		setTimeout(function () {}, Infinity);
	}
}

// Web Blob has an arrayBuffer() method that returns a Promise
// https://developer.mozilla.org/en-US/docs/Web/API/Blob/arrayBuffer
blob.constructor.prototype.arrayBuffer = function () {
	return new Promise((resolve, reject) => {
		let buf;
		try {
			buf = this.toArrayBuffer();
		} catch (err) {
			return reject(err);
		}
		resolve(buf);
	});
};
