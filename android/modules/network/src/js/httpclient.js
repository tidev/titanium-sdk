/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
'use strict';

var PersistentHandle = require('network').PersistentHandle;

var TAG = 'HTTPClient';

exports.bootstrap = function (Titanium) {

	var HTTPClient = Titanium.Network.HTTPClient;

	var _send = HTTPClient.prototype.send;
	HTTPClient.prototype.send = function (options) {
		// Retain the httpclient until the request has been finished.
		var handle = new PersistentHandle(this);

		this.on('disposehandle', function () {
			handle.dispose();
			if (kroll.DBG) {
				kroll.log(TAG, 'The persistent handle is disposed.');
			}
		});

		_send.call(this, options);
	};
};
