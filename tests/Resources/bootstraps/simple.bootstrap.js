/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';

// Note: This script's file name must end with "*.bootstrap.js" to be auto-loaded by Titainum.

// Log that this bootstrap was automatically loaded on startup.
Ti.API.info('"simple.bootstrap.js" has been required-in.');

// Flag that this bootstrap was loaded. To be read by "ti.bootstrap.test.js" script.
global.wasSimpleBootstrapLoaded = true;
