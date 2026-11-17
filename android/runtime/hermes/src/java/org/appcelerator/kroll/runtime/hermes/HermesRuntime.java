/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime.hermes;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.concurrent.atomic.AtomicBoolean;

import org.appcelerator.kroll.KrollApplication;
import org.appcelerator.kroll.KrollExternalModule;
import org.appcelerator.kroll.KrollPromise;
import org.appcelerator.kroll.KrollProxySupport;
import org.appcelerator.kroll.KrollRuntime;
import org.appcelerator.kroll.common.KrollSourceCodeProvider;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiDeployData;
import org.appcelerator.kroll.util.GCWatcher;

import com.facebook.soloader.nativeloader.NativeLoader;
import com.facebook.soloader.nativeloader.SystemDelegate;

import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.MessageQueue.IdleHandler;

import androidx.annotation.NonNull;

public final class HermesRuntime extends KrollRuntime implements Handler.Callback
{
	private static final String TAG = "KrollHermesRuntime";
	private static final String NAME = "hermes";
	private static final int MAX_IDLE_INTERVAL = 5 * 1000; // ms

	private boolean libLoaded = false;

	/** Incremented every time the runtime is disposed. Identifies the runtime instance a HermesObject was created by. */
	private static volatile int generation = 0;

	private final HashMap<String, Class<? extends KrollExternalModule>> externalModules = new HashMap<>();
	private static final HashMap<String, KrollSourceCodeProvider> externalCommonJsModules = new HashMap<>();
	private final ArrayList<String> loadedLibs = new ArrayList<>();
	private final AtomicBoolean shouldGC = new AtomicBoolean(false);
	private long lastIdle;

	/**
	 * Setup JVM garbage collection watcher to initiate Hermes garbage collections
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
	public void forceGC()
	{
		nativeIdle();
	}

	@Override
	public void initRuntime()
	{
		KrollApplication application = getKrollApplication();
		TiDeployData deployData = application.getDeployData();

		if (!libLoaded) {
			// "libhermesvm.so" calls Java through fbjni. fbjni loads libraries through NativeLoader
			// and stops the process if NativeLoader is not set up.
			NativeLoader.initIfUninitialized(new SystemDelegate());
			System.loadLibrary("c++_shared");
			System.loadLibrary("fbjni");
			// This also loads "libjsi.so" and "libhermesvm.so", which "libkroll-hermes.so" links to.
			System.loadLibrary("kroll-hermes");
			libLoaded = true;
		}

		boolean DBG = true;
		String deployType = application.getDeployType();
		if (deployType.equals("production")) {
			DBG = false;
		}

		// Instantiate a debugger here and pass it along to C++ code
		// TODO(hermes): connect the debugger. See Phase 7 of the Hermes plan.
		if (deployData.getDebuggerPort() >= 0) {
			Log.w(TAG, "The Hermes runtime does not support the debugger yet.");
		}

		nativeInit(null, DBG, false);

		loadExternalModules();
		loadExternalCommonJsModules();

		Looper.myQueue().addIdleHandler(new IdleHandler() {
			@Override
			public boolean queueIdle()
			{
				// determine if we should suggest a Hermes garbage collection
				if (shouldGC.getAndSet(false) && (System.currentTimeMillis() - lastIdle) > MAX_IDLE_INTERVAL) {

					// attempt garbage collection
					nativeIdle();
					lastIdle = System.currentTimeMillis();
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

		// Invalidate every HermesObject created by the disposed runtime.
		// Their JavaScript handles belong to a detached context and must not be used again,
		// even after a soft restart creates a new context.
		generation++;
	}

	/**
	 * Gets the identifier of the current runtime instance.
	 * It changes every time the runtime is disposed, such as during a soft restart.
	 * @return Current runtime generation.
	 */
	public static int getGeneration()
	{
		return generation;
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
		HermesObject.nativeInitObject(proxy.getClass(), proxy);
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

	@Override
	@NonNull
	public KrollPromise createPromise()
	{
		if (KrollRuntime.isDisposed()) {
			return new KrollPromise.NullPromise();
		}
		return new HermesPromise();
	}

	// JNI method prototypes
	private native void nativeInit(Object jsDebugger, boolean DBG, boolean profilerEnabled);

	private native void nativeRunModuleBytes(byte[] source, String filename, KrollProxySupport activityProxy);

	private native void nativeRunModule(String source, String filename, KrollProxySupport activityProxy);

	private native Object nativeEvalString(String source, String filename);

	private native boolean nativeIdle();

	private native void nativeDispose();

	private native void nativeAddExternalCommonJsModule(String moduleName, KrollSourceCodeProvider sourceProvider);
}
