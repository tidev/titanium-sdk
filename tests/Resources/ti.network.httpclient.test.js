/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');
const Timeout = require('./utilities/timeouts');
const { ENDPOINTS } = require('./utilities/endpoints');

describe('Titanium.Network.HTTPClient', function () {
	this.timeout(Timeout.NETWORK);

	const VERBOSE_HTTP = Ti.App.Properties.getBool('testVerboseHttp', false);
	function logRetry() { if (VERBOSE_HTTP) { Ti.API.warn('failed, attempting to retry request...'); } }
	// Safely serialize error without circular references from source proxy
	function logHttpError(e) { if (VERBOSE_HTTP) { Ti.API.debug('XHR error: ' + JSON.stringify({ code: e.code, message: e.message })); } }

	it('apiName', function () {
		const client = Ti.Network.createHTTPClient();
		should(client).have.a.readOnlyProperty('apiName').which.is.a.String();
		should(client.apiName).be.eql('Ti.Network.HTTPClient');
	});

	// FIXME iOS gives us an ELEMENT_NODE, not DOCUMENT_NODE
	it.iosBroken('responseXML', function (finish) {
		const xhr = Ti.Network.createHTTPClient({
			timeout: Timeout.NETWORK
		});
		xhr.onload = function () {
			try {
				should(xhr.responseXML === null).be.false();
				should(xhr.responseXML.nodeType).eql(9); // DOCUMENT_NODE
			} catch (err) {
				return finish(err);
			}
			finish();
		};
		let attempts = 3;
		xhr.onerror = function (e) {
			if (attempts-- > 0) {
				logRetry();
				xhr.send();
			} else {
				// Safely serialize error without circular references from source proxy
				logHttpError(e);
				finish(new Error('failed to retrieve RSS feed: ' + e)); // Windows fails here. I think we need to update the URL!
			}
		};

		xhr.open('GET', 'https://raw.githubusercontent.com/tidev/titanium-sdk/main/tests/Resources/xml/element.xml');
		xhr.send();
	});

	// Test for TIMOB-4513
	describe('.validatesSecureCertificate', () => {
		it('can be assigned Boolean', () => {
			const xhr = Ti.Network.createHTTPClient();
			should(xhr).be.an.Object();

			should(xhr.validatesSecureCertificate).not.be.ok(); // FIXME: undefined on iOS, false on Android!
			xhr.validatesSecureCertificate = true;
			should(xhr.validatesSecureCertificate).be.true();
			xhr.validatesSecureCertificate = false;
			should(xhr.validatesSecureCertificate).be.false();
		});

		it('has no accessors', () => {
			const xhr = Ti.Network.createHTTPClient();
			should(xhr).not.have.accessors('validatesSecureCertificate');
		});
	});

	it('downloadLargeFile', function (finish) {
		const xhr = Ti.Network.createHTTPClient({
			timeout: Timeout.NETWORK
		});
		xhr.onload = function () {
			//  should(xhr.responseData.length).be.greaterThan(0);
			finish();
		};
		let attempts = 3;
		xhr.onerror = function (e) {
			if (attempts-- > 0) {
				logRetry();
				xhr.send();
			} else {
				// Safely serialize error without circular references from source proxy
				logHttpError(e);
				finish(new Error('failed to retrieve large image: ' + e));
			}
		};

		xhr.open('GET', 'https://raw.githubusercontent.com/tidev/titanium-sdk/main/tests/Resources/large.jpg');
		xhr.send();
	});

	it('TIMOB-23127', function (finish) {
		const xhr = Ti.Network.createHTTPClient({
			timeout: Timeout.NETWORK
		});
		xhr.onload = () => finish();

		xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		xhr.open('POST', ENDPOINTS.post);
		xhr.send('TIMOB-23127');
	});

	it('TIMOB-23214', function (finish) {
		const xhr = Ti.Network.createHTTPClient({
			timeout: Timeout.NETWORK
		});
		xhr.onload = () => finish();

		xhr.setRequestHeader('Content-Type', 'application/json');
		xhr.open('GET', 'https://www.google.com/');
		xhr.send();
	});

	it('TIMOB-19042', function (finish) {
		const xhr = Ti.Network.createHTTPClient({
			timeout: Timeout.NETWORK
		});

		xhr.onload = function () {
			finish(new Error('onload shouldn\'t fire for an URL returning 404'));
		};
		xhr.onerror = function (e) {
			try {
				should(e.code).eql(404);
			} catch (err) {
				return finish(err);
			}
			finish();
		};

		xhr.open('GET', ENDPOINTS.status404); // BAD URL, should get 404
		xhr.send();
	});

	it('largeFileWithRedirect', function (finish) {
		// Per-request timeout must be shorter than the mocha test timeout so
		// onerror can fire and retries can run within the mocha window; with
		// equal 60s/60s timeouts mocha aborts before the first request even
		// times out, so done() is never called.
		this.timeout(Timeout.DEVICE_OPERATION);
		const xhr = Ti.Network.createHTTPClient({
			timeout: 25000
		});
		xhr.onload = function () {
			// should(xhr.responseData.length).be.greaterThan(0);
			finish();
		};
		let attempts = 3;
		xhr.onerror = function (e) {
			// httpbin.org intermittently returns 503 from its AWS ELB; treat
			// that as a transient skip rather than a hard failure, matching the
			// requestHeaderMethods test's stance.
			if (xhr.status === 503) {
				return finish();
			}
			if (attempts-- > 0) {
				logRetry();
				xhr.send();
			} else {
				// Safely serialize error without circular references from source proxy
				const errorInfo = { code: e.code, message: e.message };
				logHttpError(e);
				finish(new Error('failed to retrieve redirected large image: ' + JSON.stringify(errorInfo)));
			}
		};

		xhr.open('GET', ENDPOINTS.largeFileWithRedirect);
		xhr.send();
	});

	it('emptyPOSTSend', function (finish) {
		const xhr = Ti.Network.createHTTPClient({
			timeout: 3e4
		});
		xhr.onload = () => finish();

		let attempts = 3;
		xhr.onerror = function (e) {
			if (attempts-- > 0) {
				logRetry();
				xhr.send();
			} else {
				// Safely serialize error without circular references from source proxy
				logHttpError(e);
				finish(new Error('failed to post empty request: ' + e));
			}
		};

		xhr.open('POST', ENDPOINTS.post);
		xhr.send();
	});

	it('responseHeaders', function (finish) {
		const xhr = Ti.Network.createHTTPClient({
			timeout: 30000
		});
		xhr.onload = e => {
			try {
				const responseHeaders = e.source.responseHeaders;
				if (responseHeaders['freeform']
					&& responseHeaders['freeform'] === 'titanium=awesome') {
					return finish();
				}
				return finish(new Error('Expected header was not present'));
			} catch (err) {
				return finish(err);
			}
		};

		let attempts = 3;
		xhr.onerror = e => {
			if (attempts-- > 0) {
				logRetry();
				xhr.send();
			} else {
				// Safely serialize error without circular references from source proxy
				logHttpError(e);
				finish(new Error('failed to retrieve headers: ' + e));
			}
		};
		xhr.open('GET', ENDPOINTS.responseHeaders);
		xhr.send();
	});

	it('#getAllResponseHeaders() exists (to match XMLHTTPRequest)', () => {
		const xhr = Ti.Network.createHTTPClient();
		should(xhr.getAllResponseHeaders).be.a.Function();
	});

	it('responseHeadersBug', function (finish) {
		const xhr = Ti.Network.createHTTPClient({
			timeout: 3e4
		});
		xhr.onload = function () {
			try {
				const allHeaders = xhr.allResponseHeaders;
				should(allHeaders.toLowerCase().indexOf('server:')).be.within(0, 1 / 0);
				const header = xhr.getResponseHeader('Server');
				should(header.length).be.greaterThan(0);
			} catch (err) {
				return finish(err);
			}
			finish();
		};

		let attempts = 3;
		xhr.onerror = function (e) {
			if (attempts-- > 0) {
				logRetry();
				xhr.send();
			} else {
				// Safely serialize error without circular references from source proxy
				logHttpError(e);
				finish(new Error('failed to retrieve headers: ' + e)); // Failing on Windows here, likely need to update test!
			}
		};
		xhr.open('GET', 'http://www.google.com');
		xhr.send();
	});

	it('requestHeaderMethods', function (finish) {
		const xhr = Ti.Network.createHTTPClient({
			timeout: 3e4
		});
		xhr.onload = function (e) {
			should(e.code).eql(0);
			if (xhr.status === 200) {
				should(e.success).be.true();

				// postman-echo.com lowercases header keys, so look up the
				// lowercased names. httpbin.org preserved casing but has been
				// intermittently 503/slow (11s+), causing status 0 on the
				// simulator within the 30s timeout.
				const response = JSON.parse(xhr.responseText).headers;
				response['adhoc-header'].should.eql('notcleared');
				response.should.not.have.property('cleared-header');
			} else if (xhr.status !== 503) { // service unavailable (over quota)
				return finish(new Error(`Received unexpected response: ${xhr.status}`));
			}
			finish();
		};
		xhr.onerror = function () {
			if (xhr.status !== 503) { // service unavailable (over quota)
				return finish(new Error(`Received unexpected response: ${xhr.status}`));
			}
			finish();
		};
		xhr.open('GET', ENDPOINTS.headers);
		xhr.setRequestHeader('Adhoc-Header', 'notcleared');
		xhr.setRequestHeader('Cleared-Header', 'notcleared');
		should(function () {
			xhr.setRequestHeader('Cleared-Header', null);
		}).not.throw();
		xhr.send();
	});

	it('sendData', function (finish) {
		const xhr = Ti.Network.createHTTPClient({
			timeout: 3e4
		});
		xhr.onload = () => finish();

		let attempts = 3;
		xhr.onerror = function (e) {
			if (attempts-- > 0) {
				logRetry();
				xhr.send();
			} else {
				// Safely serialize error without circular references from source proxy
				logHttpError(e);
				finish(new Error('failed to send data: ' + e));
			}
		};
		xhr.open('POST', ENDPOINTS.post);
		xhr.send({
			message: 'check me out',
			numericid: 1234
		});
	});

	// Confirms that only the selected cookie is deleted
	// FIXME Windows hangs on this test! Maybe due to setTimeout in onload?
	it.allBroken('clearCookiePositiveTest', function (finish) {
		const xhr = Ti.Network.createHTTPClient({
			timeout: 3e4
		});

		let cookie_string;
		function second_cookie_fn() {
			try {
				const second_cookie_string = this.getResponseHeader('Set-Cookie').split(';')[0];
				// New Cookie should be different.
				should(cookie_string).not.be.eql(second_cookie_string);
			} catch (err) {
				return finish(err);
			}
			finish();
		}
		xhr.onload = function () {
			cookie_string = this.getResponseHeader('Set-Cookie').split(';')[0];
			xhr.clearCookies('https://www.google.com');
			xhr.onload = second_cookie_fn;
			// Have to do this on delay for Android, or else the open and send get cancelled due to:
			// [WARN]  TiHTTPClient: (main) [2547,14552] open cancelled, a request is already pending for response.
			// [WARN]  TiHTTPClient: (main) [1,14553] send cancelled, a request is already pending for response.
			// FIXME We should file a bug to handle this better! Can't we "queue" up the open/send calls to occur as soon as this callback finishes?
			setTimeout(function () {
				xhr.open('GET', 'https://www.google.com');
				xhr.send();
			}, 1);
		};
		xhr.onerror = function (e) {
			try {
				should(e).should.be.type('undefined');
			} catch (err) {
				finish(err);
			}
		};
		xhr.open('GET', 'https://www.google.com');
		xhr.send();
	});

	// Confirms that only the selected cookie is deleted
	it('clearCookieUnaffectedCheck', function (finish) {
		// Previously this test hit google.com twice and inspected the
		// Set-Cookie response header. google.com no longer reliably sends
		// Set-Cookie on every request, so use postman-echo's cookie API:
		// set a cookie, clear cookies for an unrelated domain, then verify
		// the cookie is still echoed back. The semantics being verified are
		// the same — clearCookies for one host must not wipe another host's
		// cookies.
		const xhr = Ti.Network.createHTTPClient({
			timeout: 3e4
		});

		xhr.onload = function () {
			try {
				const resp = JSON.parse(this.responseText);
				should(resp.cookies).have.ownProperty('k1');
				should(resp.cookies.k1).eql('v1');
			} catch (err) {
				return finish(err);
			}
			// Clear cookies for an unrelated host — this must NOT touch the
			// postman-echo.com cookie jar.
			xhr.clearCookies('http://www.microsoft.com');

			const xhr2 = Ti.Network.createHTTPClient({
				timeout: 3e4
			});
			xhr2.onload = function () {
				try {
					const resp2 = JSON.parse(this.responseText);
					// Cookie should still be present since we only cleared
					// cookies for microsoft.com, not postman-echo.com.
					should(resp2.cookies).have.ownProperty('k1');
					should(resp2.cookies.k1).eql('v1');
				} catch (err) {
					return finish(err);
				}
				finish();
			};
			xhr2.onerror = function (e) {
				finish(new Error(e.error || this.responseText));
			};
			xhr2.open('GET', ENDPOINTS.cookies);
			xhr2.send();
		};
		xhr.onerror = function (e) {
			try {
				should(e).should.be.type('undefined');
			} catch (err) {
				finish(err);
			}
		};
		xhr.open('GET', `${ENDPOINTS.cookiesSet}?k1=v1`);
		xhr.send();
	});

	// https://jira-archive.titaniumsdk.com/TIMOB-2849
	// Windows does not yet support Ti.Network.Cookie
	it.windowsMissing('setCookieClearCookieWithMultipleHTTPClients', function (finish) {
		const xhr = Ti.Network.createHTTPClient({
			timeout: 3e4
		});
		let attempts = 3;

		xhr.onload = function () {
			try {
				const resp = JSON.parse(this.responseText);
				should(resp.cookies.k1).eql('v1');
				should(resp.cookies.k2).eql('v2');
			} catch (err) {
				return finish(err);
			}

			const xhr2 = Ti.Network.createHTTPClient({
				timeout: 3e4
			});

			let attempts2 = 3;
			xhr2.onload = function () {
				try {
					if (VERBOSE_HTTP) { Ti.API.info('Clear Cookie'); }
					const resp2 = JSON.parse(this.responseText);
					should(resp2.cookies).not.have.ownProperty('v1');
					should(resp2.cookies).not.have.ownProperty('v2');
				} catch (err) {
					return finish(err);
				}
				finish();
			};
			xhr2.onerror = function (e) {
				if (attempts2-- > 0) {
					logRetry();
					xhr2.send();
				} else {
					finish(new Error(e.error || this.responseText));
				}
			};
			xhr2.open('GET', `${ENDPOINTS.cookiesDelete}?k2=&k1=`);
			xhr2.send();
		};
		xhr.onerror = function (e) {
			if (attempts-- > 0) {
				logRetry();
				xhr.send();
			} else {
				finish(new Error(e.error || this.responseText));
			}
		};
		// httpbin.org/cookies/* has been returning 503 from its AWS ELB for
		// extended periods; postman-echo.com exposes the same cookie set/delete
		// semantics and is reliably up.
		xhr.open('GET', `${ENDPOINTS.cookiesSet}?k2=v2&k1=v1`);
		xhr.send();
	});

	// https://jira-archive.titaniumsdk.com/TIMOB-11751
	// https://jira-archive.titaniumsdk.com/TIMOB-17403
	// Windows Desktop is timing out here...
	it('callbackTestForGETMethod', function (finish) {
		const xhr = Ti.Network.createHTTPClient({
			timeout: 3e4
		});
		let attempts = 3;
		let dataStreamFinished = false;

		xhr.onreadystatechange = function () {
			if (this.readyState === this.DONE) {
				if (dataStreamFinished) {
					finish();
				} else if (attempts-- > 0) {
					logRetry();
					xhr.abort();
					xhr.send();
				} else {
					finish(new Error('onreadystatechange done fired before 100% progress'));
				}
			}
		};

		xhr.ondatastream = function (e) {
			should(e.progress).be.ok();
			if (e.progress >= 1) {
				dataStreamFinished = true;
			}
		};

		xhr.onerror = function (e) {
			if (attempts-- > 0) {
				logRetry();
				xhr.abort();
				xhr.send();
			} else {
				// Safely serialize error without circular references from source proxy
				logHttpError(e);
				finish(new Error(e.error || this.responseText));
			}
		};

		xhr.open('GET', 'https://raw.githubusercontent.com/tidev/titanium-sdk/main/tests/remote/test-pdf.pdf');
		xhr.send();
	});

	// Windows Desktop is timing out here...
	it('callbackTestForPOSTMethod', function (finish) {
		const xhr = Ti.Network.createHTTPClient({
			timeout: 3e4
		});
		let attempts = 3;
		let sendStreamFinished = false;
		xhr.onreadystatechange = function () {
			if (this.readyState === this.DONE && sendStreamFinished) {
				finish();
			}
		};
		xhr.onsendstream = function (e) {
			should(e.progress).be.ok();
			if (e.progress >= 0.99) {
				sendStreamFinished = true;
			}
		};
		xhr.onerror = function (e) {
			if (attempts-- > 0) {
				logRetry();
				xhr.send();
			} else {
				// Safely serialize error without circular references from source proxy
				logHttpError(e);
				finish(new Error(e.error || this.responseText));
			}
		};
		const buffer = Ti.createBuffer({
			length: 1024 * 10
		}).toBlob();
		xhr.open('POST', ENDPOINTS.post);
		xhr.send({
			data: buffer,
			username: 'fgsandford1000',
			password: 'sanford1000',
			message: 'check me out'
		});
	});

	// FIXME Tests pass locally for me, but fail on Windows 8.1 and Win 10 desktop build agents
	// FIXME iOS doesn't work. I think because of app thinning removing Logo.png
	it.iosBroken('POST multipart/form-data containing Ti.Blob', function (finish) {
		const xhr = Ti.Network.createHTTPClient({
			timeout: Timeout.NETWORK
		});
		const imageFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'Logo.png');
		const attachment = imageFile.read();
		const name = `HEY_YOU_GUYS_WAIT_FOR_ME-${new Date().getTime()}`;

		xhr.onload = function () {
			try {
				// should(e.code).eql(200);// because our API is insane, this always returns 0
				should(xhr.status).eql(200);
				const result = JSON.parse(xhr.responseText);
				// check sent headers
				should(result).have.property('headers');
				// postman-echo lowercases header names (HTTP/2 convention), so
				// look up Content-Type case-insensitively.
				const headerKeys = Object.keys(result.headers);
				const contentTypeKey = headerKeys.find(k => k.toLowerCase() === 'content-type');
				should(contentTypeKey).be.ok();
				should(result.headers[contentTypeKey]).startWith('multipart/form-data');

				// check name got added
				should(result).have.property('form');
				should(result.form).have.property('name');
				should(result.form.name).eql(name);

				// check blob data
				// postman-echo keys files by the uploaded filename (e.g.
				// "tixhr....png") rather than the form field name ("attachment"),
				// and may report the MIME as application/octet-stream instead of
				// image/png. Verify the base64 payload is present regardless of
				// the key name or MIME type.
				should(result).have.property('files');
				const fileKeys = Object.keys(result.files);
				should(fileKeys.length).be.above(0);
				const expectedBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAJYAAACWCAYAAAA8AXHiAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAsNJREFUeNrs3b1NI0EYgGG8InQZlEFCdl1AfhGRayCiABKugMvJaIECKMP53hgZ6QJujXwzuzvf97zSyoEt2Z55NLO2/LMZx/FCqt1gCASWwBJYElgCS2BJYAksgSWBJbAElgSWwBJYElgCS2BJYAksgSWBJbAElgSWwBJYElgCS2BJYAksgSWBJbAUusuOHuur6froxoolW6GUdSv8qn057jebzXukSRnH8apcPJZja8VapsPAPx4nAiqwqqxU4XBFQdUzrPtouCZQPYA1U8dzqjC4plCV5/oCFlxQRTh57x1XVFQRXhV2iysyqhCwesQVHVUYWD3hyoAqFKwecGVBFQ7WmnGV+95mQRUS1hpxZUMVFtaacP2F6ioLqtCw1oArK6rwsJbElRlVClhL4MqOKg2sOXFNoPqVBVUqWHPgmkD1Uu77OdNYp/vMeytcJ1A9ZBvnlF+mqI0LKrCq44IKrOq4oAKrOi6owKqOCyqwquOCCqzquKACqwmucuygAqsFrmuowGqBCyqwquF6+8fVv40QWGdVTtZ3X2x/n4X6lRuw5kX1Y+ImW7jAqoEq1A+RgLUiVOWc6w0usGqj2p94KwIusM5DdeKtCLjAOh8VXGA1QwUXWM1QwQVWM1RwgdUMFVxgfaK6q40KruSwyuQeQN22QAVXUlhHVLuWqOBKBmtOVHAlgbUEKriCw1oSVXZcQzJU+zlRZcY1QAUXWP+PatF/Ys2Ea4AKLrA6R5UJ1wAVXGAFQZUB1wAVXGAFQxUZ1wDV+nGBNV8/I6H6Bi6wZmobDdUJXN11GWAuDsieyvZ4ISuWwJLO2NJtIbJiCSyBJYElsASWBJbAElgSWAJLYElgCSyBJYElsASWBJbAElgSWAJLYElgCSyBJYElsASWBJbAElgSWAJLYElgCSyBJYElsASWBJbAElgSWFqyPwIMAMpfdKkmd/FSAAAAAElFTkSuQmCC';
				const fileValue = result.files[fileKeys[0]];
				should(fileValue).be.a.String();
				should(fileValue).containEql('base64,');
				should(fileValue).containEql(expectedBase64);
			} catch (err) {
				return finish(err);
			}
			finish();
		};
		let attempts = 3;
		xhr.onerror = function (e) {
			if (attempts-- > 0) {
				logRetry();
				xhr.send();
			} else {
				// Safely serialize error without circular references from source proxy
				logHttpError(e);
				finish(new Error(e.error || this.responseText));
			}
		};

		xhr.open('POST', ENDPOINTS.post);

		const form = {
			name,
			attachment
		};
		xhr.send(form);
	});

	it.ios('basic-auth success', function (finish) {
		const xhr = Ti.Network.createHTTPClient({
			username: 'titanium',
			password: 'awesome',
			timeout: Timeout.NETWORK
		});

		xhr.onload = function () {
			try {
				should(this.responseText).be.a.String();
			} catch (err) {
				return finish(err);
			}
			finish();
		};

		let attempts = 3;
		xhr.onerror = function (e) {
			if (attempts-- > 0) {
				logRetry();
				xhr.send();
			} else {
				// Safely serialize error without circular references from source proxy
				logHttpError(e);
				finish(new Error('failed to authenticate: ' + e));
			}
		};

		xhr.open('GET', ENDPOINTS.basicAuthSuccess);
		xhr.send();
	});

	it.ios('basic-auth failure', function (finish) {
		const xhr = Ti.Network.createHTTPClient({
			username: 'titanium',
			password: 'wrong_password',
			timeout: Timeout.NETWORK
		});

		xhr.onload = e => finish(new Error('Authenticating with wrong password: ' + JSON.stringify(e, null, 1)));
		// This request should fail as password is wrong.
		xhr.onerror = () => finish();

		xhr.open('GET', ENDPOINTS.basicAuthFailure);
		xhr.send();
	});

	it.android('save response data to temp directory', function (finish) {
		const xhr = Ti.Network.createHTTPClient({
			timeout: Timeout.NETWORK
		});

		xhr.onload = function (e) {
			try {
				should(e.source.responseData.nativePath).be.a.String();
				if (e.source.responseData.nativePath.includes('cache/_tmp') !== -1) {
					finish();
				} else {
					finish(new Error('not saving response data to temp directory'));
				}
			} catch (err) {
				finish(err);
			}
		};

		let attempts = 3;
		xhr.onerror = function (e) {
			if (attempts-- > 0) {
				logRetry();
				xhr.send();
			} else {
				// Safely serialize error without circular references from source proxy
				logHttpError(e);
				finish(new Error('failed to authenticate: ' + e));
			}
		};

		xhr.open('GET', 'https://raw.githubusercontent.com/tidev/titanium-sdk/main/tests/Resources/large.jpg');
		xhr.send();
	});

	// FIXME: Windows 'source' is missing on onload
	it.windowsMissing('send on response', function (finish) {
		const xhr = Ti.Network.createHTTPClient({
			timeout: Timeout.NETWORK
		});
		this.timeout(Timeout.NETWORK);

		let count = 0;
		xhr.onload = function (e) {
			try {
				const response = e.source.responseDictionary ? e.source.responseDictionary.json : null;

				if (response !== undefined) {
					if (response && response.count <= 8) {
						return xhr.send(JSON.stringify({ count: ++count }));
					}
					return finish();
				}
				finish(new Error('invalid JSON response!\n\n' + JSON.stringify(response, null, 1)));
			} catch (err) {
				finish(err);
			}
		};
		let attempts = 3;
		xhr.onerror = function (e) {
			if (attempts-- > 0) {
				logRetry();
				xhr.send();
			} else {
				// Safely serialize error without circular references from source proxy
				logHttpError(e);
				finish(new Error(e.error || this.responseText));
			}
		};

		xhr.open('POST', ENDPOINTS.post);
		xhr.setRequestHeader('Content-Type', 'application/json; charset=utf8');
		xhr.send(JSON.stringify({ count: count }));
	});

	it.windowsMissing('.file set to a Ti.Filesystem.File object', function (finish) {
		this.timeout(Timeout.NETWORK);

		const file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'DownloadedImage.png');
		if (file.exists()) {
			file.deleteFile();
		}

		const xhr = Ti.Network.createHTTPClient({
			timeout: Timeout.NETWORK,
			file
		});
		xhr.onload = function (_e) {
			try {
				// verify that the destination file now exists
				// TODO: Verify some known contents match?
				should(xhr.file.exists()).be.true();
			} catch (err) {
				return finish(err);
			}
			finish();
		};

		let attempts = 3;
		xhr.onerror = function (e) {
			if (attempts-- > 0) {
				logRetry();
				xhr.send();
			} else {
				// Safely serialize error without circular references from source proxy
				logHttpError(e);
				finish(new Error(e.error || this.responseText));
			}
		};

		xhr.open('GET', 'https://avatars1.githubusercontent.com/u/82188?s=200&v=4');
		xhr.setRequestHeader('Accept-Encoding', 'identity');
		xhr.send();
	});

	it.android('TLSv3 support', function (finish) {
		// Only supported on Android 10+
		if (Ti.Platform.Android.API_LEVEL < 29) {
			return finish();
		}

		const client = Ti.Network.createHTTPClient({
			onload: e => {
				const html = e.source.responseText;
				try {
					// should(html).match(/id="protocol_tls1_3">(\s*<span\s+title="RFC 8446"\s*>\s*)?(<font color=green>)?Yes/);
					should(html).match(/TLS 1.3/);
				} catch (err) {
					return finish(err);
				}
				finish();
			},
			onerror: _e => finish(new Error('Could not determine TLSv3 support.')),
			timeout: 8000
		});
		client.open('GET', 'https://www.howsmyssl.com/a/check');
		client.send();
	});

	it.windowsBroken('progress event', function (finish) {
		this.timeout(Timeout.DEVICE_OPERATION);
		let progressVar = -1;
		const xhr = Ti.Network.createHTTPClient({
			timeout: 30000
		});
		xhr.onsendstream = e => {
			try {
				should(e.progress).be.above(0);
				should(e.progress).be.aboveOrEqual(progressVar);
				progressVar = e.progress;
			} catch (error) {
				finish(error);
			}
		};
		xhr.onload = _e => finish();

		let attempts = 3;
		xhr.onerror = e => {
			if (attempts-- > 0) {
				logRetry();
				xhr.send();
			} else {
				// Safely serialize error without circular references from source proxy
				const errorInfo = { code: e.code, message: e.message };
				logHttpError(e);
				finish(new Error('failed to retrieve large image: ' + JSON.stringify(errorInfo)));
			}
		};
		xhr.open('POST', ENDPOINTS.post);
		xhr.send(Ti.Utils.base64encode(Ti.Filesystem.getFile('SplashScreen.png')).toString());
	});

	it('TIMOB-27767 - trigger error callback for invalid URL', function (finish) {
		const xhr = Ti.Network.createHTTPClient({
			timeout: Timeout.NETWORK
		});
		xhr.onerror = _e => finish();
		xhr.open('GET', 'https://www.google .com/'); // URL with space
		xhr.send();
	});

	// The timing of this iOS-only unit test is very unreliable. Skip it.
	it.allBroken('#timeoutForResource', function (finish) {
		const xhr = Ti.Network.createHTTPClient({
			cache: false,
			timeout: Timeout.NETWORK,
			timeoutForResource: 50
		});

		xhr.onload = _e => finish(new Error('onload shouldn\'t fire. Resource request timeout should reach before transferring entire resource.'));

		xhr.onerror = e => {
			try {
				// Resource timeout is very less (50 milliseconds) so it should timeout before whole resource transferred
				should(e.code).eql(Ti.UI.URL_ERROR_TIMEOUT);
			} catch (err) {
				return finish(err);
			}
			finish();
		};

		xhr.open('GET', 'https://www.google.com');
		xhr.send();
	});
});
