/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

module.exports = new function() {
	var finish,
		valueOf,
		reportError,
		waitTimeout,
		Tizen = require('tizen');

	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
		reportError = testUtils.reportError;
	}

	this.name = 'download';
	this.tests = [
		{name: 'checkDownload'},
		{name: 'successDownloadFlowTest'},
		{name: 'successDownloadTest'},
		{name: 'failedDownloadTest'}
	];

	this.checkDownload  = function(testRun) {
		// Test for Tizen Device API: Download
		Ti.API.debug('Checking Download object availability.');

		var downloadRequest = Tizen.Download.createDownloadRequest({
			url: 'http://download.tizen.org/sdk/InstallManager/tizen-sdk-2.0-ubuntu32.bin',
			destination: 'documents',
			fileName: 'tmp' + (new Date().getTime())
		});

		valueOf(testRun, Tizen).shouldBeObject();
		valueOf(testRun, Tizen.Download).shouldBeObject();
		valueOf(testRun, downloadRequest).shouldBe('[object TizenDownloadDownloadRequest]');
		valueOf(testRun, downloadRequest.send).shouldBeFunction();
		valueOf(testRun, downloadRequest.pause).shouldBeFunction();
		valueOf(testRun, downloadRequest.abort).shouldBeFunction();
		valueOf(testRun, downloadRequest.resume).shouldBeFunction();

		finish(testRun);
	}

	this.successDownloadFlowTest = function(testRun) {
		var localTestRun = testRun,
			downloadId,
			wasResumed,
			wasPaused,
			waitTimeout = null,
			listener = {
				onDataStream: function(downloadRequest, receivedSize, totalSize) {
					Ti.API.debug('onDataStream event. id=' + downloadRequest.id + ', receivedSize=' + receivedSize + ', totalSize=' + totalSize);

					if (!wasPaused) {
						wasPaused = true;
						valueOf(testRun, downloadRequest.pause).shouldBeFunction();
						downloadRequest.pause();
					}

					if (wasResumed) {
						valueOf(testRun, downloadRequest.abort).shouldBeFunction();
						downloadRequest.abort();
					}
				},
				onPause: function(downloadRequest) {
					Ti.API.debug('onPause event. id=' + downloadRequest.id);

					clearFakeTimeout();
					waitTimeout = setTimeout(function() {
						valueOf(testRun, downloadRequest.resume).shouldBeFunction();

						downloadRequest.resume();
						wasResumed = true;
					}, 500);
				},
				onCancel: function(downloadRequest) {
					Ti.API.debug('onCancel event. id=' + downloadRequest.id);

					clearFakeTimeout();
					valueOf(localTestRun, downloadRequest.id).shouldBeGreaterThanEqual(0);
					finish(localTestRun);
				},
				onLoad: function(downloadRequest, fileName) {
					Ti.API.debug('onLoad event. id=' + downloadRequest.id +', fileName=' + fileName);

					clearFakeTimeout();
					valueOf(localTestRun, downloadRequest.id).shouldBeGreaterThanEqual(0);
					finish(localTestRun);
				},
				onError: function(downloadRequest, error) {
					Ti.API.debug('onError event. id=' + downloadRequest.id +', error=' + JSON.stringify(error));

					valueOf(localTestRun, error).shouldBe('[object TizenWebAPIError]');					
					clearFakeTimeout();
					reportError(localTestRun, JSON.stringify(error));
				}
			};

		// Clears timeout if it was set before.
		function clearFakeTimeout(){
			// cancel fake call if any
			waitTimeout && clearTimeout(waitTimeout); 
		}

		// Downloading large file to test callbacks.
		var downloadRequest = Tizen.Download.createDownloadRequest({
			url: 'http://download.tizen.org/sdk/InstallManager/tizen-sdk-2.0-ubuntu32.bin',
			destination: 'documents',
			fileName: 'tmp' + (new Date().getTime())
		});

		downloadId = downloadRequest.send(listener);

		valueOf(testRun, downloadRequest.toString()).shouldBe('[object TizenDownloadDownloadRequest]');	
		valueOf(testRun, downloadId).shouldBeNumber();
		valueOf(testRun, downloadId).shouldBeGreaterThanEqual(0);
	}

	this.failedDownloadTest = function(testRun) {
		var	downloadId,
			listener = {
				onDataStream: function(downloadRequest, receivedSize, totalSize) {
					reportError(testRun, 'onDataStream may not be called in this test!');
				},
				onPause: function(downloadRequest) {
					reportError(testRun, 'onPause may not be called in this test!');
				},
				onCancel: function(downloadRequest) {
					reportError(testRun, 'onCancel may not be called in this test!');
				},
				onLoad: function(downloadRequest, fileName) {
					reportError(testRun, 'onLoad may not be called in this test!');
				},
				onError: function(downloadRequest, error) {
					Ti.API.debug('onError event. id=' + downloadRequest.id + ', error=' + JSON.stringify(error));

					valueOf(testRun, error).shouldBe('[object TizenWebAPIError]');
					valueOf(testRun, error).shouldNotBeNull();

					reportError(testRun, JSON.stringify(error));
					finish(testRun);
				}
			};

		// Start downloading large file to be able to test callbacks.
		var downloadRequest = Tizen.Download.createDownloadRequest({
				url: 'http://download.tizen.org/Magic-Sofware-Package-v4.2.bin',
				destination: 'documents',
				fileName: 'tmp' + (new Date().getTime())
			});

		downloadId = downloadRequest.send(listener);

		valueOf(testRun, downloadRequest.toString()).shouldBe('[object TizenDownloadDownloadRequest]');
		valueOf(testRun, downloadId).shouldBeGreaterThanEqual(0);
	}

	this.successDownloadTest = function(testRun) {
		var	downloadId,
			listener = {
				onDataStream: function(downloadRequest, receivedSize, totalSize) {
					Ti.API.debug('onDataStream event. id=' + downloadRequest.id + ', receivedSize=' + receivedSize + ', totalSize=' + totalSize);

					valueOf(testRun, downloadRequest.id).shouldBeGreaterThanEqual(0);
					valueOf(testRun, downloadRequest.id).shouldBeEqual(downloadId);
					valueOf(testRun, totalSize).shouldBeGreaterThanEqual(0);
				},
				onPause: function(downloadRequest) {
					Ti.API.debug('onPause event. id=' + downloadRequest.id);

					valueOf(testRun, downloadRequest.id).shouldBeEqual(downloadId);

					finish(testRun);
				},
				onCancel: function(downloadRequest) {
					Ti.API.debug('onCancel event. id=' + downloadRequest.id);

					valueOf(testRun, downloadRequest.id).shouldBeEqual(downloadId);

					finish(testRun);
				},
				onLoad: function(downloadRequest, fileName) {
					Ti.API.debug('onLoad event. id=' + downloadRequest.id + ', fileName=' + fileName);

					valueOf(testRun, downloadRequest.id).shouldBeEqual(downloadId);
					valueOf(testRun, downloadRequest.id).shouldBeGreaterThanEqual(0);

					finish(testRun);
				},
				onError: function(downloadRequest, error) {
					Ti.API.debug('onError event. id=' + downloadRequest.id + ', error=' + JSON.stringify(error));

					valueOf(testRun, downloadRequest.id).shouldBeEqual(downloadId);
					valueOf(testRun, error).shouldBe('[object TizenWebAPIError]');

					reportError(testRun, JSON.stringify(error));
				}
			};

		// Start downloading large file to initate callbacks.
		downloadRequest = Tizen.Download.createDownloadRequest({
			url: 'http://download.tizen.org/sdk/1_0-larkspur/pkg_list_windows',
			destination: 'documents',
			fileName: 'tmp' + (new Date().getTime())
		});

		downloadId = downloadRequest.send();
		downloadRequest.setListener(listener);

		valueOf(testRun, downloadRequest.toString()).shouldBe('[object TizenDownloadDownloadRequest]');
		valueOf(testRun, downloadId).shouldBeGreaterThanEqual(0);
		valueOf(testRun, downloadId).shouldBeNumber();
	}
}