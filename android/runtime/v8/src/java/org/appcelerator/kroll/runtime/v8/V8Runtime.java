/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime.v8;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.atomic.AtomicBoolean;

import org.appcelerator.kroll.KrollApplication;
import org.appcelerator.kroll.KrollExternalModule;
import org.appcelerator.kroll.KrollProxySupport;
import org.appcelerator.kroll.KrollRuntime;
import org.appcelerator.kroll.common.KrollSourceCodeProvider;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiDeployData;

import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.MessageQueue.IdleHandler;

public final class V8Runtime extends KrollRuntime implements Handler.Callback
{
	private static final String TAG = "KrollV8Runtime";
	private static final String NAME = "v8";
	private static final int MAX_V8_IDLE_INTERVAL = 5 * 1000; // ms

	private boolean libLoaded = false;

	private HashMap<String, Class<? extends KrollExternalModule>> externalModules =
		new HashMap<String, Class<? extends KrollExternalModule>>();
	private static HashMap<String, KrollSourceCodeProvider> externalCommonJsModules =
		new HashMap<String, KrollSourceCodeProvider>();

	private ArrayList<String> loadedLibs = new ArrayList<String>();
	private AtomicBoolean shouldGC = new AtomicBoolean(false);
	private long lastV8Idle;

	/**
	 * Setup JVM garbage collection watcher to initiate V8 garbage collections
	 */
	private static GCWatcher watcher = new GCWatcher();

	public static boolean isEmulator()
	{
		return "goldfish".equals(Build.HARDWARE) || Build.FINGERPRINT.startsWith("generic")
			|| Build.FINGERPRINT.startsWith("unknown") || Build.MODEL.contains("google_sdk")
			|| Build.MODEL.contains("Emulator") || Build.MODEL.contains("Android SDK built for x86")
			|| Build.MANUFACTURER.contains("Genymotion")
			|| (Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic"))
			|| "google_sdk".equals(Build.PRODUCT);
	}

	@Override
	public void initRuntime()
	{
		KrollApplication application = getKrollApplication();
		TiDeployData deployData = application.getDeployData();

		if (!libLoaded) {
			System.loadLibrary("c++_shared");
			System.loadLibrary("kroll-v8");

			// TIMOB-16810 Add a delay to allow symbols to load before calling nativeInit (For HTC One Devices)
			List<String> devices = Arrays.asList("htc one", "optimus l5");
			for (String model : devices) {
				if (Build.MODEL.toLowerCase(Locale.ENGLISH).contains(model)) {
					try {
						Thread.sleep(50);
					} catch (InterruptedException e) {
					}
				}
			}

			libLoaded = true;
		}

		boolean DBG = true;
		String deployType = application.getDeployType();
		if (deployType.equals("production")) {
			DBG = false;
		}

		// Instantiate a debugger here and pass it along to C++ code
		JSDebugger jsDebugger = null;
		if (deployData.getDebuggerPort() >= 0) {
			jsDebugger = new JSDebugger(deployData.getDebuggerPort(), application.getSDKVersion());
		}

		nativeInit(jsDebugger, DBG, false);

		if (jsDebugger != null) {
			jsDebugger.start();
		}

		loadExternalModules();
		loadExternalCommonJsModules();

		Looper.myQueue().addIdleHandler(new IdleHandler() {
			@Override
			public boolean queueIdle()
			{
				// determine if we should suggest a V8 garbage collection
				if (shouldGC.getAndSet(false) && (System.currentTimeMillis() - lastV8Idle) > MAX_V8_IDLE_INTERVAL) {

					// attempt garbage collection
					nativeIdle();
					lastV8Idle = System.currentTimeMillis();
				}
				return true;
			}
		});
	}

	private void loadExternalModules()
	{
		for (String libName : externalModules.keySet()) {
			Log.d(TAG, "Bootstrapping module: " + libName, Log.DEBUG_MODE);

			try {
				if (!loadedLibs.contains(libName)) {
					System.loadLibrary(libName);
					loadedLibs.add(libName);
				}

				Class<? extends KrollExternalModule> moduleClass = externalModules.get(libName);

				KrollExternalModule module = moduleClass.newInstance();
				module.bootstrap();

			} catch (Exception e) {
				Log.e(TAG, "Error bootstrapping external module: " + e.getMessage(), e);
			}
		}
	}

	private void loadExternalCommonJsModules()
	{
		for (String moduleName : externalCommonJsModules.keySet()) {
			nativeAddExternalCommonJsModule(moduleName, externalCommonJsModules.get(moduleName));
		}
	}

	@Override
	public void doDispose()
	{
		nativeDispose();
	}

	@Override
	public void doRunModuleBytes(byte[] source, String filename, KrollProxySupport activityProxy)
	{
		nativeRunModuleBytes(source, filename, activityProxy);
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
	public String getRuntimeName()
	{
		return NAME;
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
	private native void nativeInit(JSDebugger jsDebugger, boolean DBG, boolean profilerEnabled);

	private native void nativeRunModuleBytes(byte[] source, String filename, KrollProxySupport activityProxy);

	private native void nativeRunModule(String source, String filename, KrollProxySupport activityProxy);

	private native Object nativeEvalString(String source, String filename);

	private native boolean nativeIdle();

	private native void nativeDispose();

	private native void nativeAddExternalCommonJsModule(String moduleName, KrollSourceCodeProvider sourceProvider);
}
