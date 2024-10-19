/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* globals OS_ANDROID, OS_IOS, OS_VERSION_MAJOR */
const buffer = Ti.createBuffer({ value: '' });
const blob = buffer.toBlob();
const BlobPrototype = Object.getPrototypeOf(blob);
if (OS_ANDROID) {
	// This doesn't "stick" for iOS. It is implemented natively.
	// Web Blob has an arrayBuffer() method that returns a Promise
	// https://developer.mozilla.org/en-US/docs/Web/API/Blob/arrayBuffer
	Object.defineProperty(BlobPrototype, 'arrayBuffer', {
		value: function () {
			return new Promise((resolve, reject) => {
				let buf;
				try {
					buf = this.toArrayBuffer();
				} catch (err) {
					return reject(err);
				}
				resolve(buf);
			});
		},
		enumerable: true
	});
}

if (OS_IOS) {
	if (OS_VERSION_MAJOR < 13) {
		BlobPrototype.toString = function () {
			const value = this.text;
			return (value === undefined) ? '[object TiBlob]' :  value;
		};
	}
}
