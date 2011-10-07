/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import java.util.HashMap;
import java.util.concurrent.atomic.AtomicInteger;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;

public class TiActivitySupportHelper
	implements TiActivitySupport
{
	private static final String LCAT = "TiActivitySupportHelper";
	private static final boolean DBG = TiConfig.LOGD;
	
	protected Activity activity;
	protected HashMap<Integer, TiActivityResultHandler> resultHandlers;
	protected AtomicInteger uniqueResultCodeAllocator;

	public TiActivitySupportHelper(Activity activity)
	{
		this.activity = activity;
		resultHandlers = new HashMap<Integer, TiActivityResultHandler>();
		uniqueResultCodeAllocator = new AtomicInteger(1); // start with non-zero
	}

	public int getUniqueResultCode() {
		return uniqueResultCodeAllocator.getAndIncrement();
	}

	public void launchActivityForResult(Intent intent, final int code, final TiActivityResultHandler resultHandler)
	{
		TiActivityResultHandler wrapper = new TiActivityResultHandler() {
			public void onError(Activity activity, int requestCode, Exception e)
			{
				resultHandler.onError(activity, requestCode, e);
				removeResultHandler(code);
			}

			public void onResult(Activity activity, int requestCode, int resultCode, Intent data)
			{
				resultHandler.onResult(activity, requestCode, resultCode, data);
				removeResultHandler(code);
			}
		};

		registerResultHandler(code, wrapper);
		try {
			activity.startActivityForResult(intent, code);
	 	} catch (ActivityNotFoundException e) {
			wrapper.onError(activity,code,e);
		}
	}

	public void onActivityResult(int requestCode, int resultCode, Intent data) {
		TiActivityResultHandler handler = resultHandlers.get(requestCode);
		if (handler != null) {
			handler.onResult(activity, requestCode, resultCode, data);
		}
	}

	public void removeResultHandler(int code) {
		resultHandlers.remove(code);
	}

	public void registerResultHandler(int code, TiActivityResultHandler resultHandler) {
		if (resultHandler == null) {
			Log.w(LCAT, "Received a null result handler");
		}
		resultHandlers.put(code, resultHandler);
	}
}
