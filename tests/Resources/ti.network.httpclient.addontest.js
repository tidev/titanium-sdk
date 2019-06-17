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
const should = require('./utilities/assertions');

describe('Titanium.Network.HTTPClient', function () {
	this.timeout(6e4);

	it.windowsMissing('.file set to a Ti.Filesystem.File object', function (finish) {
		this.timeout(6e4);

		const downloadedImageFile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'DownloadedImage.png');
		if (downloadedImageFile.exists()) {
			downloadedImageFile.deleteFile();
		}

		const xhr = Ti.Network.createHTTPClient({});
		xhr.setTimeout(6e4);
		xhr.onload = function (e) {
			try {
				// verify that the destination file now exists
				// TODO: Verify some known contents match?
				should(xhr.file.exists()).be.true;

				finish();
			} catch (err) {
				finish(err);
			}
		};
		xhr.onerror = e => finish(e);

		xhr.open('GET', 'https://avatars1.githubusercontent.com/u/82188?s=200&v=4');
		xhr.setRequestHeader('Accept-Encoding', 'identity');
		xhr.file = downloadedImageFile;
		xhr.send();
	});
});
