/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.util;

import org.json.JSONObject;

import android.os.Handler;

import org.appcelerator.titanium.TitaniumActivity;
import org.appcelerator.titanium.config.TitaniumConfig;
import android.util.Log;
import android.webkit.WebView;

public class TitaniumJavascriptHelper
{
	private static final String LCAT = "TiJSHelper";
	private static final boolean DBG = TitaniumConfig.LOGD;

	private static final String NOTIFICATION_1 =
		" var n = Titanium.UI.createAlertDialog(); n.setTitle('HTTPClient');" +
		"n.setMessage('";
	private static final String NOTIFICATION_2 =
		"'); n.setButtonNames('OK'); n.show();"
		;


	public static String createTitaniumNotification(String message) {
		String result = null;

		if (message != null) {
			result = NOTIFICATION_1 + message + NOTIFICATION_2;
		} else {
			result = NOTIFICATION_1 + "null" + NOTIFICATION_2;
		}
		return result;
	}
}
