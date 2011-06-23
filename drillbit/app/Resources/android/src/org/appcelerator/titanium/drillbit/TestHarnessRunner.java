/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.drillbit;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.HashMap;

import android.app.Activity;
import android.app.Instrumentation;
import android.content.Intent;
import android.os.Bundle;
import android.os.Looper;
import android.util.Log;

public class TestHarnessRunner extends Instrumentation
{
	private static final String TAG = "TestHarnessRunner";
	private static final String ARGUMENT_CLASS = "class";

	protected String activityClassName;
	protected HashMap<String, String> exceptions = new HashMap<String, String>();

	@Override
	public void onCreate(Bundle arguments)
	{
		super.onCreate(arguments);
		if (arguments != null) {
			activityClassName = arguments.getString(ARGUMENT_CLASS);
		}
		if (activityClassName == null) {
			Log.e(TAG, "No \"class\" parameter provided, exiting.");
			finish(Activity.RESULT_CANCELED, new Bundle());
		}
		else {
			start();
		}
	}

	@Override
	public void onStart()
	{
		super.onStart();
		Looper.prepare();

		Log.d(TAG, "Starting package/activity: " + getTargetContext().getPackageName() + "/" + activityClassName);
		Intent intent = new Intent();
		intent.setClassName(getTargetContext(), activityClassName);
		intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
		Activity activity = startActivitySync(intent);
		if (activity instanceof InstrumentedActivity)
		{
			((InstrumentedActivity)activity).setInstrumentation(this);
		}
		waitForIdleSync();
	}

	@Override
	public boolean onException(Object obj, Throwable e)
	{
		// log, but ignore exceptions
		StringWriter stringWriter = new StringWriter();
		PrintWriter printWriter = new PrintWriter(stringWriter);
		e.printStackTrace(printWriter);
		exceptions.put(obj.toString(), stringWriter.toString());
		return true;
	}
}
