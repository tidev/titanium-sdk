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

describe.ios('Titanium.UI.iOS', function () {

	it('#constants', function () {

		// Used in WebView.basicAuthentication.persistence
		should(Ti.UI.iOS.CREDENTIAL_PERSISTENCE_NONE).be.a.Number;
		should(Ti.UI.iOS.CREDENTIAL_PERSISTENCE_FOR_SESSION).be.a.Number;
		should(Ti.UI.iOS.CREDENTIAL_PERSISTENCE_PERMANENT).be.a.Number;
		should(Ti.UI.iOS.CREDENTIAL_PERSISTENCE_SYNCHRONIZABLE).be.a.Number;

		// Used in WebViewConfiguration.mediaTypesRequiringUserActionForPlayback
		should(Ti.UI.iOS.AUDIOVISUAL_MEDIA_TYPE_NONE).be.a.Number;
		should(Ti.UI.iOS.AUDIOVISUAL_MEDIA_TYPE_AUDIO).be.a.Number;
		should(Ti.UI.iOS.AUDIOVISUAL_MEDIA_TYPE_VIDEO).be.a.Number;
		should(Ti.UI.iOS.AUDIOVISUAL_MEDIA_TYPE_ALL).be.a.Number;

		// Used in WebView.cachePolicy
		should(Ti.UI.iOS.CACHE_POLICY_USE_PROTOCOL_CACHE_POLICY).be.a.Number;
		should(Ti.UI.iOS.CACHE_POLICY_RELOAD_IGNORING_LOCAL_CACHE_DATA).be.a.Number;
		should(Ti.UI.iOS.CACHE_POLICY_RETURN_CACHE_DATA_ELSE_LOAD).be.a.Number;
		should(Ti.UI.iOS.CACHE_POLICY_RETURN_CACHE_DATA_DONT_LOAD).be.a.Number;

		// Used in WebViewConfiguration.selectionGranularity
		should(Ti.UI.iOS.SELECTION_GRANULARITY_DYNAMIC).be.a.Number;
		should(Ti.UI.iOS.SELECTION_GRANULARITY_CHARACTER).be.a.Number;

		// Used in WebViewDecisionHandler.invoke
		should(Ti.UI.iOS.ACTION_POLICY_CANCEL).be.a.Number;
		should(Ti.UI.iOS.ACTION_POLICY_ALLOW).be.a.Number;

		// Used in WebView.addUserScript.injectionTime
		should(Ti.UI.iOS.INJECTION_TIME_DOCUMENT_START).be.a.Number;
		should(Ti.UI.iOS.INJECTION_TIME_DOCUMENT_END).be.a.Number;

	});

});
