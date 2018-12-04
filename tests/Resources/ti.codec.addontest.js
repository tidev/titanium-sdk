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
var should = require('./utilities/assertions');

describe('Ti.Codec', function () {
	describe('#encodeNumber', function () {
		it('should throw Error when "dest" not specified', function () {
			should(function () {
				Ti.Codec.encodeNumber({
					source: 123,
					type: Ti.Codec.TYPE_LONG,
				});
			}).throw();
		});

		it('should throw Error when "source" not specified', function () {
			should(function () {
				var buffer = Ti.createBuffer({
					length: 8
				});
				Ti.Codec.encodeNumber({
					dest: buffer,
					type: Ti.Codec.TYPE_LONG,
				});
			}).throw();
		});

		it('should throw Error when "type" not specified', function () {
			should(function () {
				var buffer = Ti.createBuffer({
					length: 8
				});
				Ti.Codec.encodeNumber({
					source: 123,
					dest: buffer
				});
			}).throw();
		});
	});

	describe('#decodeNumber', function () {
		it('should throw Error when "source" not specified', function () {
			should(function () {
				var buffer = Ti.createBuffer({
					length: 8
				});
				Ti.Codec.decodeNumber({
					dest: buffer,
					type: Ti.Codec.TYPE_LONG,
				});
			}).throw();
		});

		it('should throw Error when "type" not specified', function () {
			should(function () {
				var buffer = Ti.createBuffer({
					length: 8
				});
				Ti.Codec.decodeNumber({
					source: 123,
					dest: buffer
				});
			}).throw();
		});
	});
});
