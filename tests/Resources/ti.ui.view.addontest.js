/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Titanium.UI.View', function () {

	it.ios('.horizontalMotionEffect, .verticalMotionEffect', function (finish) {
		var win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});

		var view = Ti.UI.createView({
			horizontalMotionEffect: {
				min: -50,
				max: 50
			},
			verticalMotionEffect: {
				min: -50,
				max: 50
			}
		});

		win.addEventListener('open', function () {
			// horizontalMotionEffect
			should(view.horizontalMotionEffect).be.an.Object;
			should(view.horizontalMotionEffect.min).be.a.Number;
			should(view.horizontalMotionEffect.max).be.a.Number;

			// verticalMotionEffect
			should(view.verticalMotionEffect).be.an.Object;
			should(view.verticalMotionEffect.min).be.a.Number;
			should(view.verticalMotionEffect.max).be.a.Number;

			finish();
		});

		win.add(view);
		win.open();
	});
});
