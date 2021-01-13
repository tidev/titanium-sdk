/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* globals OS_ANDROID */
import PersistentHandle from './persistentHandle';

if (OS_ANDROID) {
	const HTTPClient = Titanium.Network.HTTPClient;

	const _send = HTTPClient.prototype.send;
	HTTPClient.prototype.send = function (options) {
		// Retain the httpclient until the request has been finished.
		const handle = new PersistentHandle(this);

		this.on('disposehandle', function () {
			handle.dispose();
			if (kroll.DBG) {
				kroll.log('HTTPClient', 'The persistent handle is disposed.');
			}
		});

		_send.call(this, options);
	};
}
