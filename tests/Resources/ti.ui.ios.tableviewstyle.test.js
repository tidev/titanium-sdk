/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* global OS_VERSION_MAJOR */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');

describe.ios('Titanium.UI.iOS.TableViewStyle', function () {

	it('#constants', function () {
		should(Titanium.UI.iOS.TableViewStyle.PLAIN).be.a.Number();
		should(Titanium.UI.iOS.TableViewStyle.GROUPED).be.a.Number();
		if (OS_VERSION_MAJOR >= 13) {
			should(Titanium.UI.iOS.TableViewStyle.INSET_GROUPED).be.a.Number();
		}
	});
});
