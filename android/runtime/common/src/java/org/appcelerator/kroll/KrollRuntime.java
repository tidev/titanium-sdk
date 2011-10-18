/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import android.os.Handler;
import android.os.Looper;
import android.os.Message;


public abstract class KrollRuntime implements Handler.Callback
{
	private static final String TAG = "KrollRuntime";
	private static final int MSG_DISPOSE = 100;
	private static final int MSG_RUN_MODULE = 101;
	private static final String PROPERTY_FILENAME = "filename";

	private static KrollRuntime _instance;

	private long mainThreadId;

	protected Handler mainHandler;

	public static final int MSG_LAST_ID = MSG_RUN_MODULE + 100;


	protected KrollRuntime()
	{
		Looper mainLooper = Looper.getMainLooper();
		mainThreadId = mainLooper.getThread().getId();
		mainHandler = new Handler(mainLooper, this);
	}

	public static void init(KrollRuntime runtime)
	{
		if (_instance == null) {
			_instance = runtime;
		}
	}

	public static KrollRuntime getInstance()
	{
		return _instance;
	}

	public Handler getMainHandler()
	{
		return mainHandler;
	}

	public boolean isUiThread()
	{
		return Thread.currentThread().getId() == mainThreadId;
	}

	public void dispose()
	{
		if (isUiThread()) {
			doDispose();
		} else {
			mainHandler.sendEmptyMessage(MSG_DISPOSE);
		}
	}

	public abstract void doDispose();

	public void runModule(String source, String filename)
	{
		if (isUiThread()) {
			doRunModule(source, filename);
		} else {
			Message msg = mainHandler.obtainMessage(MSG_RUN_MODULE, source);
			msg.getData().putString(PROPERTY_FILENAME, filename);
			msg.sendToTarget();
		}
	}

	public abstract void doRunModule(String source, String filename);

	public abstract void initObject(Object proxyObject);

	public boolean handleMessage(Message msg)
	{
		switch (msg.what) {
			case MSG_DISPOSE:
				doDispose();
				return true;
			case MSG_RUN_MODULE:
				String source = (String) msg.obj;
				String filename = msg.getData().getString(PROPERTY_FILENAME);
				doRunModule(source, filename);
				return true;
		}
		return false;
	}
}
