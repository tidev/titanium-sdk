/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

import { ENDPOINTS } from '../../../tests/Resources/utilities/endpoints.js';
import { expect } from 'chai';

// tcpHost and tcpRequestPath are raw host/path helpers (not full URLs),
// so exclude them from the URL-shape checks below.
const URL_KEYS = Object.keys(ENDPOINTS).filter(key => !['tcpHost', 'tcpRequestPath'].includes(key));

describe('endpoints', function () {
	it('exports an ENDPOINTS object', () => {
		expect(ENDPOINTS).to.be.an('object');
	});

	it('all endpoint values are non-empty URL strings', () => {
		for (const key of URL_KEYS) {
			const value = ENDPOINTS[key];
			expect(value, key).to.be.a('string').that.is.not.empty;
			expect(() => new URL(value), key).to.not.throw();
		}
	});

	it('uses the configured base as the host', () => {
		const expectedHost = (process.env.TI_TEST_ENDPOINTS_BASE && new URL(process.env.TI_TEST_ENDPOINTS_BASE).host) || 'postman-echo.com';
		for (const [key, value] of Object.entries(ENDPOINTS)) {
			if (key === 'tcpHost' || key === 'tcpRequestPath') continue;
			expect(new URL(value).host, key).to.equal(expectedHost);
		}
	});

	it('exposes the named endpoints we need', () => {
		expect(ENDPOINTS).to.include.all.keys(
			'post',
			'status404',
			'redirect',
			'responseHeaders',
			'headers',
			'basicAuthSuccess',
			'basicAuthFailure',
			'largeFileWithRedirect'
		);
	});

	it('exposes TCP host and request path helpers', () => {
		expect(ENDPOINTS.tcpHost).to.equal('postman-echo.com');
		expect(ENDPOINTS.tcpRequestPath).to.equal('/get');
	});

	it('exposes cookie and webview endpoints added during implementation', () => {
		expect(ENDPOINTS).to.include.all.keys('cookies', 'cookiesSet', 'cookiesDelete', 'webviewRedirect');
		for (const key of ['cookies', 'cookiesSet', 'cookiesDelete', 'webviewRedirect']) {
			expect(() => new URL(ENDPOINTS[key]), key).to.not.throw();
		}
	});
});
