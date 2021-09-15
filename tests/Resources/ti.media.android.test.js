/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2021-Present by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint no-undef: "off" */
/* eslint mocha/no-identical-title: "off" */
'use strict';

const should = require('./utilities/assertions');

describe.android('Titanium.Media.Android', () => {

	describe('properties', () => {
		describe('.apiName', () => {
			it('is a String', () => {
				should(Ti.Media.Android).have.a.readOnlyProperty('apiName').which.is.a.String();
			});

			it('equals Ti.Media.Android', () => {
				should(Ti.Media.Android.apiName).eql('Ti.Media.Android');
			});
		});
	});

	describe('methods', () => {

		describe('#scanMediaFiles', () => {
			it('is a Function', () => {
				should(Ti.Media.Android.scanMediaFiles).be.a.Function();
			});

			it('callback', finish => {
				const src = Ti.Filesystem.getFile('large.jpg');
				const dst = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'temp.jpg');
				src.copy(dst.nativePath);

				Ti.Media.Android.scanMediaFiles([ dst.nativePath ], null, e => {
					should(e).be.a.Object();
					should(e.path).be.a.String();
					should(e.path).eql('file://' + dst.nativePath);
					finish();
				});
			});

			it('promise', async () => {
				const src = Ti.Filesystem.getFile('large.jpg');
				const dst = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'temp.jpg');
				src.copy(dst.nativePath);

				const scanned = await Ti.Media.Android.scanMediaFiles([ dst.nativePath ], null);
				should(scanned).be.a.Array();
				should(scanned.length).eql(1);

				should(scanned[0]).be.a.Object();
				should(scanned[0].path).be.a.String();
				should(scanned[0].path).eql('file://' + dst.nativePath);
			});
		});
	});
});
