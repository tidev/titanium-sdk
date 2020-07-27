/*
 * Axway Appcelerator Titanium Mobile
 * Copyright (c) 2011-2018 by Axway Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env titanium */
/* eslint no-unused-expressions: "off" */
'use strict';

// --------------------------------------------------------------------------------
// This Android "service" script executes at regular intervals via a timer.
// --------------------------------------------------------------------------------

// Log that this script has been executed.
Ti.API.info('Executing service script: "ti.android.service.interval.js"');

// Notify owner that this service has been executed.
Ti.App.fireEvent('service.interval:executed', {});
