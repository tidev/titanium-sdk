/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime.v8;

import org.appcelerator.kroll.KrollRuntime;

import android.os.Build;
import android.os.Handler;
import android.os.Message;
import android.util.Log;

public final class V8Runtime extends KrollRuntime implements Handler.Callback
{
	private static final String TAG = "KrollV8Runtime";
	private static final String DEVICE_LIB = "kroll-v8-device";
	private static final String EMULATOR_LIB = "kroll-v8-emulator";

	private static final int MSG_PROCESS_DEBUG_MESSAGES = KrollRuntime.MSG_LAST_ID + 100;

	public V8Runtime()
	{
		boolean useGlobalRefs = true;
		String libName = DEVICE_LIB;
		if (Build.PRODUCT.equals("sdk") || Build.PRODUCT.equals("google_sdk")) {
			Log.i(TAG, "Loading emulator version of kroll-v8");
			libName = EMULATOR_LIB;
			useGlobalRefs = false;
		}

		System.loadLibrary(libName);
		nativeInit(useGlobalRefs);
	}

	@Override
	public void doDispose()
	{
		nativeDispose();
	}

	@Override
	public void doRunModule(String source, String filename)
	{
		nativeRunModule(source, filename);
	}

	@Override
	public void initObject(Object proxyObject)
	{
		V8Object.nativeInitObject(proxyObject.getClass(), proxyObject);
	}

	protected void dispatchDebugMessages()
	{
		mainHandler.sendEmptyMessage(MSG_PROCESS_DEBUG_MESSAGES);
	}

	@Override
	public boolean handleMessage(Message msg)
	{
		switch (msg.what) {
			case MSG_PROCESS_DEBUG_MESSAGES:
				nativeProcessDebugMessages();
				return true;
		}
		return false;
	}

	private native void nativeInit(boolean useGlobalRefs);
	private native void nativeRunModule(String source, String filename);
	private native void nativeProcessDebugMessages();
	private native void nativeDispose();
}
