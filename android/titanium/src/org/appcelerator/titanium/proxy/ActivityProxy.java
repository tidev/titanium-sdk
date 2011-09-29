/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.proxy;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiActivityResultHandler;
import org.appcelerator.titanium.util.TiActivitySupport;
import org.appcelerator.titanium.util.TiActivitySupportHelper;
import org.appcelerator.titanium.util.TiConfig;

import android.app.Activity;
import android.content.Intent;

@Kroll.proxy
@Kroll.dynamicApis(properties = {
	"onCreateOptionsMenu",
	"onPrepareOptionsMenu"
})
public class ActivityProxy extends KrollProxy
	implements TiActivityResultHandler
{
	private static final String TAG = "ActivityProxy";
	private static boolean DBG = TiConfig.LOGD;

	protected Activity wrappedActivity;
	protected IntentProxy intentProxy;

	public ActivityProxy()
	{
	}

	public ActivityProxy(Activity activity)
	{
		setWrappedActivity(activity);
	}
	
	public void setWrappedActivity(Activity activity)
	{
		this.wrappedActivity = activity;
		Intent intent = activity.getIntent();
		if (intent != null) {
			intentProxy = new IntentProxy(activity.getIntent());
		}
	}

	protected Activity getWrappedActivity()
	{
		if (wrappedActivity != null) {
			return wrappedActivity;
		}
		return TiApplication.getInstance().getRootActivity();
	}

	@Kroll.method
	public void startActivity(IntentProxy intent)
	{
		Activity activity = getWrappedActivity();
		if (activity != null) {
			activity.startActivity(intent.getIntent());
		}
	}

	@Kroll.method
	public void startActivityForResult(IntentProxy intent)
	{
		Activity activity = getWrappedActivity();
		if (activity != null) {
			TiActivitySupport support = null;
			if (activity instanceof TiActivitySupport) {
				support = (TiActivitySupport)activity;
			} else {
				support = new TiActivitySupportHelper(activity);
			}

			int requestCode = support.getUniqueResultCode();
			support.launchActivityForResult(intent.getIntent(), requestCode, this);
		}
	}

	@Kroll.method
	public void startActivityFromChild(ActivityProxy child, IntentProxy intent, int requestCode)
	{
		Activity activity = getWrappedActivity();
		if (activity != null) {
			activity.startActivityFromChild(child.getWrappedActivity(), intent.getIntent(), requestCode);
		}
	}

	@Kroll.method
	public boolean startActivityIfNeeded(IntentProxy intent, int requestCode)
	{
		Activity activity = getWrappedActivity();
		if (activity != null) {
			return activity.startActivityIfNeeded(intent.getIntent(), requestCode);
		}
		return false;
	}

	@Kroll.method
	public boolean startNextMatchingActivity(IntentProxy intent)
	{
		Activity activity = getWrappedActivity();
		if (activity != null) {
			return activity.startNextMatchingActivity(intent.getIntent());
		}
		return false;
	}

	@Kroll.method
	public String getString(int resId, Object[] formatArgs)
	{
		Activity activity = getWrappedActivity();
		if (activity != null) {
			if (formatArgs == null || formatArgs.length == 0) {
				return activity.getString(resId);
			} else {
				return activity.getString(resId, formatArgs);
			}
		}
		return null;
	}

	@Kroll.method @Kroll.getProperty
	public IntentProxy getIntent()
	{
		return intentProxy;
	}

	@Kroll.method @Kroll.setProperty
	public void setRequestedOrientation(int orientation)
	{
		Activity activity = getWrappedActivity();
		if (activity != null) {
			activity.setRequestedOrientation(orientation);
		}
	}

	@Kroll.method
	public void setResult(int resultCode,
		@Kroll.argument(optional=true) IntentProxy intent)
	{
		Activity activity = getWrappedActivity();
		if (activity != null) {
			if (intent == null) {
				activity.setResult(resultCode);
			} else {
				activity.setResult(resultCode, intent.getIntent());
			}
		}
	}

	@Kroll.method
	public void finish()
	{
		Activity activity = getWrappedActivity();
		if (activity != null) {
			activity.finish();
		}
	}

	public void onResult(Activity activity, int requestCode, int resultCode, Intent data)
	{
		KrollDict event = new KrollDict();
		event.put(TiC.EVENT_PROPERTY_REQUEST_CODE, requestCode);
		event.put(TiC.EVENT_PROPERTY_RESULT_CODE, resultCode);
		event.put(TiC.EVENT_PROPERTY_INTENT, new IntentProxy(data));
		event.put(TiC.EVENT_PROPERTY_SOURCE, this);
		fireEvent("result", event);
	}

	public void onError(Activity activity, int requestCode, Exception e)
	{
		KrollDict event = new KrollDict();
		event.put(TiC.EVENT_PROPERTY_REQUEST_CODE, requestCode);
		event.put(TiC.EVENT_PROPERTY_ERROR, e.getMessage());
		event.put(TiC.EVENT_PROPERTY_SOURCE, this);
		fireEvent("error", event);
	}

	/*
	public Context getContext()
	{
		if (activity == null) {
			return TiApplication.getInstance();
		}
		return activity;
	}
	*/

	public void release()
	{
		super.release();
		wrappedActivity = null;
	}
}
