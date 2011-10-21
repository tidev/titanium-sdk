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

	private KrollRuntimeThread runtimeThread;
	private long runtimeThreadId;
	private Looper runtimeLooper;

	protected static KrollRuntime runtimeInstance;

	protected Handler runtimeHandler;

	public static final int MSG_LAST_ID = MSG_RUN_MODULE + 100;

	public static final Object UNDEFINED = new Object() {
		public String toString()
		{
			return "undefined";
		}
	};


	public static class KrollRuntimeThread extends Thread
	{
		private static final String TAG = "KrollRuntimeThread";

		private Looper looper;
		private KrollRuntime runtime = null;

		public KrollRuntimeThread(KrollRuntime runtime)
		{
			super(TAG);
			this.runtime = runtime;
		}

		public void run()
		{
			Looper.prepare();

			synchronized (this) {
				looper = Looper.myLooper();
				notifyAll();
			}

			runtime.runtimeThreadId = looper.getThread().getId();
			runtime.runtimeLooper = looper;
			runtime.runtimeHandler = new Handler(looper, runtime);

			runtime.initRuntime();
			Looper.loop();
		}

		public Looper getLooper()
		{
			if (!isAlive()) {
				return null;
			}

			synchronized (this) {
				while (isAlive() && looper == null) {
					try {
						wait();

					} catch (InterruptedException e) {
					}
				}
			}

			return looper;
		}
	}


	public static void init(KrollRuntime runtime)
	{
		if (runtimeInstance == null) {
			runtime.runtimeThread = new KrollRuntimeThread(runtime);
			runtime.runtimeThread.start();
			runtimeInstance = runtime;
		}
	}

	public static KrollRuntime getInstance()
	{
		return runtimeInstance;
	}

	public boolean isRuntimeThread()
	{
		return Thread.currentThread().getId() == runtimeThreadId;
	}

	public Looper getRuntimeLooper()
	{
		return runtimeLooper;
	}

	public Handler getRuntimeHandler()
	{
		return runtimeHandler;
	}

	public void dispose()
	{
		if (isRuntimeThread()) {
			doDispose();

		} else {
			runtimeHandler.sendEmptyMessage(MSG_DISPOSE);
		}
	}

	public void runModule(String source, String filename)
	{
		if (isRuntimeThread()) {
			doRunModule(source, filename);

		} else {
			Message message = runtimeHandler.obtainMessage(MSG_RUN_MODULE, source);
			message.getData().putString(PROPERTY_FILENAME, filename);
			message.sendToTarget();
		}
	}

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

	public abstract void initRuntime();
	public abstract void doDispose();
	public abstract void doRunModule(String source, String filename);
	public abstract void initObject(KrollProxySupport proxy);
}

