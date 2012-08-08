/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime.v8;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.concurrent.atomic.AtomicBoolean;

import org.appcelerator.kroll.KrollExternalModule;
import org.appcelerator.kroll.KrollProxySupport;
import org.appcelerator.kroll.KrollRuntime;
import org.appcelerator.kroll.common.KrollSourceCodeProvider;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiDeployData;

import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.Message;
import android.os.MessageQueue.IdleHandler;

public final class V8Runtime extends KrollRuntime implements Handler.Callback
{
	private static final String TAG = "KrollV8Runtime";
	private static final String NAME = "v8";
	private static final int MSG_PROCESS_DEBUG_MESSAGES = KrollRuntime.MSG_LAST_ID + 100;
	private static final int MAX_V8_IDLE_INTERVAL = 30 * 1000; // ms

	private boolean libLoaded = false;

	private HashMap<String, Class<? extends KrollExternalModule>> externalModules = new HashMap<String, Class<? extends KrollExternalModule>>();
	private static HashMap<String, KrollSourceCodeProvider>
		externalCommonJsModules = new HashMap<String, KrollSourceCodeProvider>();

	private ArrayList<String> loadedLibs = new ArrayList<String>();
	private AtomicBoolean shouldGC = new AtomicBoolean(false);
	private long lastV8Idle;

	@Override
	public void initRuntime()
	{
		boolean useGlobalRefs = true;
		TiDeployData deployData = getKrollApplication().getDeployData();

		if (Build.PRODUCT.equals("sdk") || Build.PRODUCT.equals("google_sdk") || Build.FINGERPRINT.startsWith("generic")) {
			Log.d(TAG, "Emulator detected, storing global references in a global Map", Log.DEBUG_MODE);
			useGlobalRefs = false;
		}

		if (!libLoaded) {
			System.loadLibrary("stlport_shared");
			System.loadLibrary("kroll-v8");
			libLoaded = true;
		}
		
		boolean DBG = true;
		String deployType = getKrollApplication().getDeployType();
		if (deployType.equals("production")) {
			DBG = false;
		}

		nativeInit(useGlobalRefs, deployData.getDebuggerPort(), DBG);
		
		if (deployData.isDebuggerEnabled()) {
			dispatchDebugMessages();
		}

		loadExternalModules();
		loadExternalCommonJsModules();

		Looper.myQueue().addIdleHandler(new IdleHandler() {
			@Override
			public boolean queueIdle()
			{
				boolean willGC = shouldGC.getAndSet(false);
				if (!willGC) {
					// This means we haven't specifically been told to do
					// a V8 GC (which is just a call to nativeIdle()), but nevertheless
					// if more than the recommended time has passed since the last
					// call to nativeIdle(), we'll want to do it anyways.
					willGC = ((System.currentTimeMillis() - lastV8Idle) > MAX_V8_IDLE_INTERVAL);
				}
				if (willGC) {
					boolean gcWantsMore = !nativeIdle();
					lastV8Idle = System.currentTimeMillis();
					if (gcWantsMore) {
						shouldGC.set(true);
					}
				}
				return true;
			}
		});
	}

	private void loadExternalModules()
	{
		for (String libName : externalModules.keySet()) {
			Log.d(TAG, "Bootstrapping module: " + libName, Log.DEBUG_MODE);

			if (!loadedLibs.contains(libName)) {
				System.loadLibrary(libName);
				loadedLibs.add(libName);
			}

			Class<? extends KrollExternalModule> moduleClass = externalModules.get(libName);

			try {
				KrollExternalModule module = moduleClass.newInstance();
				module.bootstrap();

			} catch (IllegalAccessException e) {
				Log.e(TAG, "Error bootstrapping external module: " + e.getMessage(), e);

			} catch (InstantiationException e) {
				Log.e(TAG, "Error bootstrapping external module: " + e.getMessage(), e);
			}
		}
	}

	private void loadExternalCommonJsModules()
	{
		for (String moduleName : externalCommonJsModules.keySet()) {
			nativeAddExternalCommonJsModule(moduleName,externalCommonJsModules.get(moduleName));
		}
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
	public Object doEvalString(String source, String filename)
	{
		return nativeEvalString(source, filename);
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
				dispatchDebugMessages();

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

	public void addExternalModule(String libName, Class<? extends KrollExternalModule> moduleClass)
	{
		externalModules.put(libName, moduleClass);
	}

	public static void addExternalCommonJsModule(String id, Class<? extends KrollSourceCodeProvider> jsSourceProvider)
	{
		KrollSourceCodeProvider providerInstance;
		try {
			providerInstance = jsSourceProvider.newInstance();
			externalCommonJsModules.put(id, providerInstance);
		} catch (Exception e) {
			Log.e(TAG, "Cannot load external CommonJS module " + id, e);
		}
	}

	@Override
	public void setGCFlag()
	{
		shouldGC.set(true);
	}

	// JNI method prototypes
	private native void nativeInit(boolean useGlobalRefs, int debuggerPort, boolean DBG);
	private native void nativeRunModule(String source, String filename, KrollProxySupport activityProxy);
	private native Object nativeEvalString(String source, String filename);
	private native void nativeProcessDebugMessages();
	private native boolean nativeIdle();
	private native void nativeDispose();
	private native void nativeAddExternalCommonJsModule(String moduleName, KrollSourceCodeProvider sourceProvider);
}

