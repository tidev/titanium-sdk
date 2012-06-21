/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var harnessGlobal = new Object();

harnessGlobal.common = require("common");
harnessGlobal.common.init(harnessGlobal);

harnessGlobal.util = require("util");
harnessGlobal.util.init(harnessGlobal);

harnessGlobal.suites = [
	{name: "analytics"},
	{name: "blob"},
	{name: "buffer"},
	{name: "codec"},
	{name: "console"},
	{name: "database"},
	{name: "facebook"},
	{name: "filesystem/filesystem"},
	//{name: "json"},
	{name: "jss/jss"},
	{name: "kroll"},
	{name: "locale"},
	{name: "media/media"},
	{name: "network_httpclient"},
	{name: "network"},
	{name: "network_socket"},
	{name: "network_socket_tcp"},
	{name: "platform"},
	{name: "properties"},
	{name: "stream"},
	{name: "titanium"},
	{name: "ui/ui"},
	{name: "ui_2dMatrix"},
	{name: "ui_clipboard"},
	{name: "ui_controls"},
	{name: "yahoo"}
];

if (Ti.Platform.osname === 'android') {
	harnessGlobal.suites = harnessGlobal.suites.concat([
		{name: "android/android_database/android_database"},
		{name: "android/android_filesystem"},
		{name: "android/android_geolocation"},
		{name: "android/android_kroll"},
		{name: "android/android_network_httpclient"},
		{name: "android/android_notificationmgr"},
		{name: "android/android_platform"},
		{name: "android/android_resources/android_resources"},
		{name: "android/android_string"},
		{name: "android/android_ui/android_ui"}
	]);

} else if((Ti.Platform.osname === 'iPhone') || (Ti.Platform.osname === 'iPad')) {
	harnessGlobal.suites = harnessGlobal.suites.concat([
		{name: "iphone/iphone_2Dmatrix"},
		{name: "iphone/iphone_ui"},
		{name: "iphone/iphone_UI_3DMatrix"}
	]);
}

harnessGlobal.socketPort = 40404;
harnessGlobal.common.connectToDriver();
