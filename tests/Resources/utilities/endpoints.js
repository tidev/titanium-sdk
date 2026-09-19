/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */
'use strict';

/**
 * Centralized test endpoint URLs. Tests must import from here instead of
 * hardcoding `postman-echo.com` paths, so the next time the public echo
 * service goes down (cf. the httpbin.org → postman-echo.com migration in
 * e4fc7a0) the swap is a one-file change.
 *
 * To point tests at a local mock instead, set TI_TEST_ENDPOINTS_BASE in
 * the environment; this module will use that as the host base for every
 * endpoint.
 */
const BASE = process.env.TI_TEST_ENDPOINTS_BASE || 'https://postman-echo.com';

const ENDPOINTS = {
	post: `${BASE}/post`,
	status404: `${BASE}/status/404`,
	redirect: `${BASE}/redirect-to?url=https%3A%2F%2Fraw.githubusercontent.com%2Ftidev%2Ftitanium-sdk%2Fmain%2Ftests%2FResources%2Flarge.jpg`,
	responseHeaders: `${BASE}/response-headers?freeform=titanium%3Dawesome`,
	headers: `${BASE}/headers`,
	basicAuthSuccess: `${BASE}/basic-auth`,
	basicAuthFailure: `${BASE}/basic-auth`,
	// Fallback endpoints used when the primary basic-auth service is down.
	// httpbin.org embeds the credentials in the path; postman-echo.com uses
	// the Authorization header, so the fallback needs its own URL form.
	basicAuthSuccessFallback: 'https://httpbin.org/basic-auth/titanium/awesome',
	basicAuthFailureFallback: 'https://httpbin.org/basic-auth/titanium/wrong',
	largeFileWithRedirect: `${BASE}/redirect-to?url=https%3A%2F%2Fraw.githubusercontent.com%2Ftidev%2Ftitanium-sdk%2Fmain%2Ftests%2FResources%2Flarge.jpg`,
	cookies: `${BASE}/cookies`,
	cookiesSet: `${BASE}/cookies/set`,
	cookiesDelete: `${BASE}/cookies/delete`,
	webviewRedirect: `${BASE}/redirect-to?url=${encodeURIComponent(`${BASE}/get`)}`,
	tcpHost: 'postman-echo.com',
	tcpRequestPath: '/get'
};

module.exports = { ENDPOINTS };
