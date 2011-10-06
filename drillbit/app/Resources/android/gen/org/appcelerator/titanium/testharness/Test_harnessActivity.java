/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.testharness;

import android.app.Activity;
import android.app.Instrumentation;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.TiRootActivity;
import org.appcelerator.titanium.proxy.InstrumentationProxy;
import org.appcelerator.titanium.drillbit.InstrumentedActivity;

public final class Test_harnessActivity extends TiRootActivity
	implements InstrumentedActivity
{
	private static final String TAG = "TestHarnessActivity";

	public void setInstrumentation(Instrumentation instrumentation)
	{
		KrollDict options = new KrollDict();
		options.put("instrumentation", new InstrumentationProxy(instrumentation));
		activityProxy.fireEvent("instrumentationReady", options);
	}

}
