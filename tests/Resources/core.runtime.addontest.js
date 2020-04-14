/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */

'use strict';

const should = require('./utilities/assertions');

describe.windowsBroken('Core', () => {
	describe('Runtime', () => {
		describe('Static Method Reference', () => {

			// Reference static method.
			const createProxy = Ti.createProxy;
			should(createProxy).be.a.Function;

			// Attempt to call static method.
			const result = createProxy({});
			should(result).be.a.Object;
		});
	});
});
