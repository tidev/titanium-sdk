/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import java.util.concurrent.atomic.AtomicBoolean;

import org.appcelerator.kroll.common.TiMessenger;
import org.appcelerator.kroll.util.KrollAssetHelper;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.os.Message;
import android.util.Log;


public abstract class KrollRuntime implements Handler.Callback
{
	private static final String TAG = "KrollRuntime";
	private static final int MSG_DISPOSE = 100;
	private static final int MSG_RUN_MODULE = 101;

	private static final String PROPERTY_FILENAME = "filename";
	private static final String PROPERTY_SOURCE = "source";

	private static KrollRuntime instance;

	private KrollRuntimeThread thread;
	private long threadId;
	private AtomicBoolean initialized = new AtomicBoolean(false);

	protected Handler handler;

	public static final int MSG_LAST_ID = MSG_RUN_MODULE + 100;

	public static final Object UNDEFINED = new Object() {
		public String toString()
		{
			return "undefined";
		}
	};

	public static final int DONT_INTERCEPT = Integer.MIN_VALUE + 1;
	public static final int DEFAULT_THREAD_STACK_SIZE = 16 * 1024;

	public static class KrollRuntimeThread extends Thread
	{
		private static final String TAG = "KrollRuntimeThread";

		private KrollRuntime runtime = null;

		public KrollRuntimeThread(KrollRuntime runtime, int stackSize)
		{
			super(null, null, TAG, stackSize);
			this.runtime = runtime;
		}

		public void run()
		{
			Looper looper;

			Looper.prepare();
			synchronized (this) {
				looper = Looper.myLooper();
				notifyAll();
			}

			// initialize the runtime instance
			runtime.threadId = looper.getThread().getId();
			runtime.handler = new Handler(looper, runtime);

			// initialize the TiMessenger instance for the runtime thread
			// NOTE: this must occur after threadId is set and before initRuntime() is called
			TiMessenger.getMessenger();

			runtime.initRuntime(); // initializer for the specific runtime implementation (V8, Rhino, etc)
			runtime.initialized.set(true);

			// start handling messages for this thread
			Looper.loop();
		}
	}

	public static void init(Context context, KrollRuntime runtime)
	{
		if (instance == null) {
			int stackSize = runtime.getThreadStackSize(context);
			runtime.thread = new KrollRuntimeThread(runtime, stackSize);
			instance = runtime; // make sure this is set before the runtime thread is started
			runtime.thread.start();
		}
		KrollAssetHelper.init(context);
	}

	public static KrollRuntime getInstance()
	{
		return instance;
	}

	public boolean isRuntimeThread()
	{
		return Thread.currentThread().getId() == threadId;
	}

	public long getThreadId()
	{
		return threadId;
	}

	public void dispose()
	{
		if (isRuntimeThread()) {
			doDispose();

		} else {
			handler.sendEmptyMessage(MSG_DISPOSE);
		}
	}

	public void runModule(String source, String filename, KrollProxySupport activityProxy)
	{
		while (!initialized.get()) {
			try {
				Thread.sleep(200L);
			} catch (InterruptedException e) {
				Log.e(TAG, e.getMessage(), e);
			}
		}

		if (isRuntimeThread()) {
			doRunModule(source, filename, activityProxy);

		} else {
			Message message = handler.obtainMessage(MSG_RUN_MODULE, activityProxy);
			message.getData().putString(PROPERTY_SOURCE, source);
			message.getData().putString(PROPERTY_FILENAME, filename);
			message.sendToTarget();
		}
	}

	public int getThreadStackSize(Context context)
	{
		if (context instanceof KrollApplication) {
			KrollApplication app = (KrollApplication) context;
			return app.getThreadStackSize();
		}
		return DEFAULT_THREAD_STACK_SIZE;
	}

	public boolean handleMessage(Message msg)
	{
		switch (msg.what) {
			case MSG_DISPOSE:
				doDispose();
				return true;

			case MSG_RUN_MODULE:
				String source = msg.getData().getString(PROPERTY_SOURCE);
				String filename = msg.getData().getString(PROPERTY_FILENAME);
				KrollProxySupport activityProxy = (KrollProxySupport) msg.obj;

				doRunModule(source, filename, activityProxy);
				return true;
		}

		return false;
	}

	public abstract void initRuntime();
	public abstract void doDispose();
	public abstract void doRunModule(String source, String filename, KrollProxySupport activityProxy);
	public abstract void initObject(KrollProxySupport proxy);
}

