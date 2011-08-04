/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.testharness;

import android.app.Activity;
import android.app.Instrumentation;
import android.util.Log;
import android.os.Bundle;
import android.os.Environment;

import dalvik.system.DexClassLoader;

import java.io.File;

import org.appcelerator.titanium.TiRootActivity;
import org.appcelerator.titanium.TiScriptRunner;
import org.appcelerator.titanium.kroll.KrollBridge;
import org.appcelerator.titanium.kroll.KrollContext;
import org.appcelerator.titanium.drillbit.InstrumentedActivity;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Scriptable;

public final class Test_harnessActivity extends TiRootActivity
	implements InstrumentedActivity
{
	private static final String TAG = "TestHarnessActivity";
	protected Instrumentation instrumentation;
	protected Function callback;
	protected KrollBridge krollBridge;
	protected KrollContext krollContext;

	@Override
	public void contextCreated()
	{
		super.contextCreated();

		// Our TiContext should be non-null at this point
		if (tiContext == null) {
			Log.e(TAG, "TiContext is null for test_harness activity, binding aborted");
			return;
		}

		krollBridge = tiContext.getKrollBridge();
		if (krollBridge == null) {
			Log.e(TAG, "KrollBridge is null for test_harness activity, binding aborted");
			return;
		}

		krollContext = krollBridge.getKrollContext();
		if (krollContext == null) {
			Log.e(TAG, "KrollContext is null for test_harness activity, binding aborted");
			return;
		}

		Scriptable global = krollContext.getScope();
		Context context = Context.enter();
		context.setOptimizationLevel(-1);
		try {
			krollBridge.bindToTopLevel("TestHarnessActivity", Context.javaToJS(this, global));
		} finally {
			Context.exit();
		}
	}

	public void onRunnerReady(Function callback)
	{
		this.callback = callback;
	}

	public void setInstrumentation(Instrumentation instrumentation)
	{
		this.instrumentation = instrumentation;
		if (krollBridge == null || krollContext == null) {
			Log.e(TAG, "Bridge/context is null for test_harness activity, finishing");
			finish();
			return;
		}

		final Instrumentation fInstrumentation = instrumentation;
		krollContext.post(new Runnable() {
			@Override
			public void run()
			{
				Scriptable global = krollContext.getScope();
				Context context = Context.enter();
				context.setOptimizationLevel(-1);
				try {
					krollBridge.bindToTopLevel("TestHarnessRunner", Context.javaToJS(fInstrumentation, global));
					Log.i(TAG, "Running tests from custom Activity...");
					callback.call(context, global, global, new Object[0]);
				} finally {
					Context.exit();
					krollBridge = null;
					krollContext = null;
					callback = null;
				}
			}
		});
	}

	public void loadTest(Scriptable scope)
	{
		Context context = Context.enter();
		try {
			File extDir = Environment.getExternalStorageDirectory();
			File harnessDir = new File(extDir, getPackageName());
			File testJar = new File(harnessDir, "test.jar");
			DexClassLoader loader = new DexClassLoader(testJar.getAbsolutePath(),
				getCacheDir().getAbsolutePath(), null, getClassLoader());
			try {
				Class<?> scriptClass = loader.loadClass(getPackageName() + ".js.test");
				TiScriptRunner.getInstance().runScript(context, scope, scriptClass);
			} catch (ClassNotFoundException e) {
				Log.e(TAG, e.getMessage(), e);
			}
		} finally {
			Context.exit();
		}
	}
}