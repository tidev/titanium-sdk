/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime.v8;

import org.appcelerator.kroll.KrollProxySupport;
import org.appcelerator.kroll.KrollRuntime;

import android.os.Build;
import android.os.Handler;
import android.os.Message;
import android.util.Log;


public final class V8Runtime extends KrollRuntime implements Handler.Callback
{
	private static final String TAG = "KrollV8Runtime";
	private static final String NAME = "v8";
	private static final String DEVICE_LIB = "kroll-v8-device";
	private static final String EMULATOR_LIB = "kroll-v8-emulator";
	private static final int MSG_PROCESS_DEBUG_MESSAGES = KrollRuntime.MSG_LAST_ID + 100;


	@Override
	public void initRuntime()
	{
		boolean useGlobalRefs = true;
		String libName = DEVICE_LIB;

		if (Build.PRODUCT.equals("sdk") || Build.PRODUCT.equals("google_sdk")) {
			Log.i(TAG, "Loading emulator version of kroll-v8");
			libName = EMULATOR_LIB;
			useGlobalRefs = false;
		}

		boolean debuggerEnabled = getKrollApplication().isDebuggerEnabled();

		System.loadLibrary(libName);
		nativeInit(useGlobalRefs, debuggerEnabled);
	}

	@Override
	public void doDispose()
	{
		nativeDispose();
	}

	@Override
	public void doRunModule(String source, String filename, KrollProxySupport activityProxy)
	{
		nativeRunModule(source, filename, activityProxy);
	}

	@Override
	public void initObject(KrollProxySupport proxy)
	{
		V8Object.nativeInitObject(proxy.getClass(), proxy);
	}

	@Override
	public boolean handleMessage(Message message)
	{
		switch (message.what) {
			case MSG_PROCESS_DEBUG_MESSAGES:
				nativeProcessDebugMessages();

				return true;
		}

		return super.handleMessage(message);
	}

	@Override
	public String getRuntimeName()
	{
		return NAME;
	}

	protected void dispatchDebugMessages()
	{
		handler.sendEmptyMessage(MSG_PROCESS_DEBUG_MESSAGES);
	}


	// JNI method prototypes
	private native void nativeInit(boolean useGlobalRefs, boolean debuggerActive);
	private native void nativeRunModule(String source, String filename, KrollProxySupport activityProxy);
	private native void nativeProcessDebugMessages();
	private native void nativeDispose();
}

