/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');

describe.ios('Titanium.UI.iOS', function () {

	it('#createWebViewProcessPool()', function () {
		should(Ti.UI.iOS.createWebViewProcessPool).not.be.undefined();
		should(Ti.UI.iOS.createWebViewProcessPool).be.a.Function();
		var pool = Ti.UI.iOS.createWebViewProcessPool();
		should(pool).be.an.Object();
	});

	it('#createWebViewConfiguration()', function () {
		should(Ti.UI.iOS.createWebViewConfiguration).not.be.undefined();
		should(Ti.UI.iOS.createWebViewConfiguration).be.a.Function();
		var configuration = Ti.UI.iOS.createWebViewConfiguration();
		should(configuration).be.an.Object();
	});

});

describe.ios('Titanium.UI.iOS.WebViewConfiguration', function () {

	it('allowsPictureInPictureMediaPlayback', function () {
		var configuration = Ti.UI.iOS.createWebViewConfiguration({
			allowsPictureInPictureMediaPlayback: true
		});
		var webview = Ti.UI.createWebView({
			url: 'https://google.com',
			configuration: configuration
		});
		should(webview.allowsPictureInPictureMediaPlayback).be.a.Boolean();
		should(webview.allowsPictureInPictureMediaPlayback).be.true();
	});

	it('suppressesIncrementalRendering', function () {
		var configuration = Ti.UI.iOS.createWebViewConfiguration({
			suppressesIncrementalRendering: true
		});
		var webview = Ti.UI.createWebView({
			url: 'https://google.com',
			configuration: configuration
		});

		should(webview.suppressesIncrementalRendering).be.a.Boolean();
		should(webview.suppressesIncrementalRendering).be.true();
	});

	it('allowsAirPlayMediaPlayback', function () {
		var configuration = Ti.UI.iOS.createWebViewConfiguration({
			allowsAirPlayMediaPlayback: true
		});
		var webview = Ti.UI.createWebView({
			url: 'https://google.com',
			configuration: configuration
		});

		should(webview.allowsAirPlayMediaPlayback).be.a.Boolean();
		should(webview.allowsAirPlayMediaPlayback).be.true();
	});

	it('allowsInlineMediaPlayback', function () {
		var configuration = Ti.UI.iOS.createWebViewConfiguration({
			allowsInlineMediaPlayback: true
		});
		var webview = Ti.UI.createWebView({
			url: 'https://google.com',
			configuration: configuration
		});

		should(webview.allowsInlineMediaPlayback).be.a.Boolean();
		should(webview.allowsInlineMediaPlayback).be.true();
	});

	it('selectionGranularity', function () {
		var configuration = Ti.UI.iOS.createWebViewConfiguration({
			selectionGranularity: Ti.UI.iOS.SELECTION_GRANULARITY_CHARACTER
		});
		var webview = Ti.UI.createWebView({
			url: 'https://google.com',
			configuration: configuration
		});

		should(webview.selectionGranularity).be.a.Number();
		should(webview.selectionGranularity).eql(Ti.UI.iOS.SELECTION_GRANULARITY_CHARACTER);
	});

	it('mediaTypesRequiringUserActionForPlayback', function () {
		var configuration = Ti.UI.iOS.createWebViewConfiguration({
			mediaTypesRequiringUserActionForPlayback: Titanium.UI.iOS.AUDIOVISUAL_MEDIA_TYPE_AUDIO
		});
		var webview = Ti.UI.createWebView({
			url: 'https://google.com',
			configuration: configuration
		});

		should(webview.mediaTypesRequiringUserActionForPlayback).be.a.Number();
		should(webview.mediaTypesRequiringUserActionForPlayback).eql(Titanium.UI.iOS.AUDIOVISUAL_MEDIA_TYPE_AUDIO);
	});

	it('preferences', function () {
		var configuration = Ti.UI.iOS.createWebViewConfiguration({
			preferences: {
				minimumFontSize: 20.0,
				javaScriptEnabled: true,
				javaScriptCanOpenWindowsAutomatically: false
			}
		});
		var webview = Ti.UI.createWebView({
			url: 'https://google.com',
			configuration: configuration
		});

		should(webview.preferences).be.an.Object();
		should(webview.preferences.minimumFontSize).be.a.Number();
		should(webview.preferences.minimumFontSize).eql(20.0);
		should(webview.preferences.javaScriptEnabled).be.a.Boolean();
		should(webview.preferences.javaScriptEnabled).be.true();
		should(webview.preferences.javaScriptCanOpenWindowsAutomatically).be.a.Boolean();
		should(webview.preferences.javaScriptCanOpenWindowsAutomatically).be.false();
	});
});

// TO DO: Add more unit tests for WebViewConfiguration and WebViewDecisionHandlerProxy
