/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import java.lang.ref.WeakReference;
import java.util.HashMap;
import java.util.concurrent.CountDownLatch;

import org.appcelerator.kroll.KrollExceptionHandler.ExceptionMessage;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiMessenger;
import org.appcelerator.kroll.util.KrollAssetHelper;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.os.Message;

/**
 * The common Javascript runtime instance that Titanium interacts with.
 * 
 * The runtime instance itself is static and lives with the Android process.
 * KrollRuntime use activity reference counting to tear down the runtime state
 * when all of the application's Titanium activities have been destroyed.
 * 
 * Even after all of the activities have been destroyed, Android can (and usually does)
 * keep the application process running. When the application is re-entered from
 * this "torn down" state, we simply re-initialize again, this time from the first
 * activity ref increment (TiBaseActivity.onCreate), instead of TiApplication.onCreate
 */
public abstract class KrollRuntime implements Handler.Callback
{
	private static final String TAG = "KrollRuntime";
	private static final int MSG_INIT = 100;
	private static final int MSG_DISPOSE = 101;
	private static final int MSG_RUN_MODULE = 102;
	private static final int MSG_EVAL_STRING = 103;

	private static final String PROPERTY_FILENAME = "filename";
	private static final String PROPERTY_SOURCE = "source";

	private static KrollRuntime instance;
	private static int activityRefCount = 0;
	private static int serviceRefCount = 0;

	private WeakReference<KrollApplication> krollApplication;
	private KrollRuntimeThread thread;
	private long threadId;
	private CountDownLatch initLatch = new CountDownLatch(1);
	private KrollEvaluator evaluator;
	private KrollExceptionHandler primaryExceptionHandler;
	private HashMap<String, KrollExceptionHandler> exceptionHandlers;

	public enum State {
		INITIALIZED, RELEASED, RELAUNCHED, DISPOSED
	}
	private static State runtimeState = State.DISPOSED;

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
	public static final String SOURCE_ANONYMOUS = "<anonymous>";

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

			// initialize the runtime
			runtime.doInit();

			// start handling messages for this thread
			Looper.loop();
		}
	}

	public static void init(Context context, KrollRuntime runtime)
	{
		// Initialized the runtime if it isn't already initialized
		if (runtimeState != State.INITIALIZED) {
			int stackSize = runtime.getThreadStackSize(context);
			runtime.krollApplication = new WeakReference<KrollApplication>((KrollApplication) context);
			runtime.thread = new KrollRuntimeThread(runtime, stackSize);
			runtime.exceptionHandlers = new HashMap<String, KrollExceptionHandler>();

			instance = runtime; // make sure this is set before the runtime thread is started
			runtime.thread.start();
		}

		KrollAssetHelper.init(context);
	}

	public static KrollRuntime getInstance()
	{
		return instance;
	}

	public static void suggestGC()
	{
		if (instance != null) {
			instance.setGCFlag();
		}
	}

	public static boolean isInitialized()
	{
		if (instance != null) {
			synchronized (runtimeState) {
				return runtimeState == State.INITIALIZED;
			}
		}
		return false;
	}

	public KrollApplication getKrollApplication()
	{
		if (krollApplication != null) {
			return krollApplication.get();
		}
		return null;
	}
	
	public boolean isRuntimeThread()
	{
		return Thread.currentThread().getId() == threadId;
	}

	public long getThreadId()
	{
		return threadId;
	}

	protected void doInit()
	{
		// initializer for the specific runtime implementation (V8, Rhino, etc)
		initRuntime();

		// Notify the main thread that the runtime has been initialized
		synchronized (runtimeState) {
			runtimeState = State.INITIALIZED;
		}
		initLatch.countDown();
	}

	public void dispose()
	{

		Log.d(TAG, "Disposing runtime.", Log.DEBUG_MODE);

		// Set state to released when since we have not fully disposed of it yet
		synchronized (runtimeState) {
			runtimeState = State.RELEASED;
		}

		// Cancel all timers associated with the app
		KrollApplication app = krollApplication.get();
		if (app != null) {
			app.cancelTimers();
		}

		if (isRuntimeThread()) {
			internalDispose();

		} else {
			handler.sendEmptyMessage(MSG_DISPOSE);
		}
	}

	public void runModule(String source, String filename, KrollProxySupport activityProxy)
	{
		if (isRuntimeThread()) {
			doRunModule(source, filename, activityProxy);

		} else {
			Message message = handler.obtainMessage(MSG_RUN_MODULE, activityProxy);
			message.getData().putString(PROPERTY_SOURCE, source);
			message.getData().putString(PROPERTY_FILENAME, filename);
			message.sendToTarget();
		}
	}

	/**
	 * Equivalent to <pre>evalString(source, SOURCE_ANONYMOUS)</pre>
	 * @see #evalString(String, String)
	 * @param source A string containing Javascript source
	 * @return The Java representation of the return value of {@link source}, as long as Kroll supports the return value
	 */
	public Object evalString(String source)
	{
		return evalString(source, SOURCE_ANONYMOUS);
	}

	/**
	 * Evaluates a String of Javascript code, returning the result of the execution
	 * when this method is called on the KrollRuntime thread. If this method is called
	 * ony any other thread, then the code is executed asynchronous, and this method returns null.
	 * 
	 * Currently, Kroll supports converting the following Javascript return types:
	 * <ul>
	 * <li>Primitives (String, Number, Boolean, etc)</li>
	 * <li>Javascript object literals as {@link org.appcelerator.kroll.KrollDict}</li>
	 * <li>Arrays</li>
	 * <li>Any Proxy type that extends {@link org.appcelerator.kroll.KrollProxy}</li>
	 * </ul>
	 * @param source A string containing Javascript source
	 * @param filename The name of the filename represented by {@link source}
	 * @return The Java representation of the return value of {@link source}, as long as Kroll supports the return value
	 */
	public Object evalString(String source, String filename)
	{
		if (isRuntimeThread()) {
			return doEvalString(source, filename);

		} else {
			Message message = handler.obtainMessage(MSG_EVAL_STRING);
			message.getData().putString(PROPERTY_SOURCE, source);
			message.getData().putString(PROPERTY_FILENAME, filename);
			message.sendToTarget();
			return null;
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
			case MSG_INIT: {
				doInit();
				return true;
			}

			case MSG_DISPOSE: {
				internalDispose();
				return true;
			}

			case MSG_RUN_MODULE: {
				String source = msg.getData().getString(PROPERTY_SOURCE);
				String filename = msg.getData().getString(PROPERTY_FILENAME);
				KrollProxySupport activityProxy = (KrollProxySupport) msg.obj;

				doRunModule(source, filename, activityProxy);
				return true;
			}

			case MSG_EVAL_STRING: {
				String source = msg.getData().getString(PROPERTY_SOURCE);
				String filename = msg.getData().getString(PROPERTY_FILENAME);

				doEvalString(source, filename);
				return true;
			}
		}

		return false;
	}

	private static void waitForInit()
	{
		try {
			instance.initLatch.await();
		} catch (InterruptedException e) {
			Log.e(TAG, "Interrupted while waiting for runtime to initialize", e);
		}
	}

	private static void syncInit()
	{
		waitForInit();

		// When the process is re-entered, it is either in the RELEASED or DISPOSED state. If it is in the RELEASED
		// state, that means we have not disposed of the runtime from the previous launch. In that case, we set the
		// state to RELAUNCHED. If we are in the DISPOSED state, we need to re-initialize the runtime here.
		synchronized (runtimeState) {
			if (runtimeState == State.DISPOSED) {
				instance.initLatch = new CountDownLatch(1);
				instance.handler.sendEmptyMessage(MSG_INIT);

			} else if (runtimeState == State.RELEASED) {
				runtimeState = State.RELAUNCHED;
			}
		}

		waitForInit();
	}

	// The runtime instance keeps an internal reference count of all Titanium activities
	// and all Titanium services that have been opened/started by the application.
	// When the ref counts for both of them drop to 0, then we know there is nothing left
	// to execute on the runtime, and we can therefore dispose of it.
	public static void incrementActivityRefCount()
	{
		activityRefCount++;
		if ((activityRefCount + serviceRefCount) == 1 && instance != null) {
			syncInit();
		}
	}

	public static void decrementActivityRefCount()
	{
		activityRefCount--;
		if ((activityRefCount + serviceRefCount) > 0 || instance == null) {
			return;
		}

		instance.dispose();
	}

	public static int getActivityRefCount()
	{
		return activityRefCount;
	}

	// Similar to {@link #incrementActivityRefCount} but for a Titanium Service.
	public static void incrementServiceRefCount()
	{
		serviceRefCount++;
		if ((activityRefCount + serviceRefCount) == 1 && instance != null) {
			syncInit();
		}
	}

	public static void decrementServiceRefCount()
	{
		serviceRefCount--;
		if ((activityRefCount + serviceRefCount) > 0 || instance == null) {
			return;
		}

		instance.dispose();
	}

	public static int getServiceRefCount()
	{
		return serviceRefCount;
	}

	private void internalDispose()
	{
		synchronized (runtimeState) {
			if (runtimeState == State.RELAUNCHED) {
				// Abort the dispose if the application has been re-launched since we scheduled this dispose during the
				// last exit. Then set it back to the initialized state.
				runtimeState = State.INITIALIZED;
				return;
			}

			runtimeState = State.DISPOSED;
		}

		doDispose();

		KrollApplication app = krollApplication.get();
		if (app != null) {
			app.dispose();
		}
	}

	public KrollEvaluator getEvaluator()
	{
		return evaluator;
	}

	public void setEvaluator(KrollEvaluator eval)
	{
		evaluator = eval;
	}

	public void setGCFlag()
	{
		// No-op in Rhino, V8 should override.
	}

	public State getRuntimeState()
	{
		return runtimeState;
	}

	/**
	 * Sets the default exception handler for the runtime. There can only be one default exception handler set at a
	 * time.
	 * 
	 * @param handler The exception handler to set
	 * @module.api
	 */
	public static void setPrimaryExceptionHandler(KrollExceptionHandler handler)
	{
		if (instance != null) {
			instance.primaryExceptionHandler = handler;
		}
	}

	/**
	 * Adds an exception handler to a list of handlers that will be called in addition to the default one. To replace the
	 * default exception, use {@link #setPrimaryExceptionHandler(KrollExceptionHandler)}.
	 * 
	 * @param handler The exception handler to set
	 * @param key The key for the exception handler
	 * @module.api
	 */
	public static void addAdditionalExceptionHandler(KrollExceptionHandler handler, String key)
	{
		if (instance != null && key != null) {
			instance.exceptionHandlers.put(key, handler);
		}
	}

	/**
	 * Removes the exception handler from the list of additional handlers. This will not affect the default handler.
	 * @param key The key for the exception handler
	 * @module.api
	 */
	public static void removeExceptionHandler(String key)
	{
		if (instance != null && key != null) {
			instance.exceptionHandlers.remove(key);
		}
	}

	public static void dispatchException(final String title, final String message, final String sourceName, final int line,
		final String lineSource, final int lineOffset)
	{
		if (instance != null) {
			HashMap<String, KrollExceptionHandler> handlers = instance.exceptionHandlers;
			KrollExceptionHandler currentHandler;

			if (!handlers.isEmpty()) {
				for (String key : handlers.keySet()) {
					currentHandler = handlers.get(key);
					if (currentHandler != null) {
						currentHandler.handleException(new ExceptionMessage(title, message, sourceName, line, lineSource,
							lineOffset));
					}
				}
			}

			// Handle exception with defaultExceptionHandler
			instance.primaryExceptionHandler.handleException(new ExceptionMessage(title, message, sourceName, line, lineSource,
				lineOffset));
		}
	}

	public abstract void doDispose();
	public abstract void doRunModule(String source, String filename, KrollProxySupport activityProxy);
	public abstract Object doEvalString(String source, String filename);

	public abstract String getRuntimeName();
	public abstract void initRuntime();
	public abstract void initObject(KrollProxySupport proxy);
}

