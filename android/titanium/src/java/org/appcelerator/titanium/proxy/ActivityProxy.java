/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.proxy;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiActivityResultHandler;
import org.appcelerator.titanium.util.TiActivitySupport;
import org.appcelerator.titanium.util.TiActivitySupportHelper;

import android.app.Activity;
import android.content.Intent;
import android.os.Build;
import android.os.Message;

@Kroll.proxy(propertyAccessors = {
	TiC.PROPERTY_ON_CREATE_OPTIONS_MENU,
	TiC.PROPERTY_ON_PREPARE_OPTIONS_MENU
})
/**
 * This is a proxy representation of the Android Activity type.
 * Refer to <a href="http://developer.android.com/reference/android/app/Activity.html">Android Activity</a>
 * for more details.
 */
public class ActivityProxy extends KrollProxy
	implements TiActivityResultHandler
{
	private static final String TAG = "ActivityProxy";
	private static final int MSG_FIRST_ID = KrollProxy.MSG_LAST_ID + 1;
	private static final int MSG_INVALIDATE_OPTIONS_MENU = MSG_FIRST_ID + 100;
	private static final int MSG_OPEN_OPTIONS_MENU = MSG_FIRST_ID + 101;

	protected Activity wrappedActivity;
	protected IntentProxy intentProxy;
	protected DecorViewProxy savedDecorViewProxy;

	private KrollFunction resultCallback;
	
	public ActivityProxy()
	{
	}

	public ActivityProxy(Activity activity)
	{
		setActivity(activity);
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
	public DecorViewProxy getDecorView()
	{
		if (savedDecorViewProxy == null) {
			Activity activity = getActivity();
			if (!(activity instanceof TiBaseActivity)) {
				Log.e(TAG, "Unable to return decor view, activity is not TiBaseActivity", Log.DEBUG_MODE);

				return null;
			}

			DecorViewProxy decorViewProxy = new DecorViewProxy(((TiBaseActivity)activity).getLayout());
			decorViewProxy.setActivity(activity);
			savedDecorViewProxy = decorViewProxy;
		}
		
		return savedDecorViewProxy;
		
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
	public void startActivityForResult(IntentProxy intent, KrollFunction callback)
	{
		Activity activity = getWrappedActivity();
		if (activity != null) {
			TiActivitySupport support = null;
			if (activity instanceof TiActivitySupport) {
				support = (TiActivitySupport)activity;
			} else {
				support = new TiActivitySupportHelper(activity);
			}

			this.resultCallback = callback;
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

	@Kroll.method
	public String getDir(String name, int mode)
	{
		Activity activity = getWrappedActivity();
		if (activity != null) {
			return activity.getDir(name, mode).getAbsolutePath();
		}
		return null;
	}

	@Kroll.method @Kroll.getProperty
	public TiWindowProxy getWindow()
	{
		Activity activity = getWrappedActivity();
		if (!(activity instanceof TiBaseActivity)) {
			return null;
		}

		TiBaseActivity tiActivity = (TiBaseActivity) activity;
		return tiActivity.getWindowProxy();
	}

	@Kroll.method
	public void openOptionsMenu()
	{
		if (TiApplication.isUIThread()) {
			handleOpenOptionsMenu();
		} else {
			getMainHandler().obtainMessage(MSG_OPEN_OPTIONS_MENU).sendToTarget();
		}
	}

	@Kroll.method
	public void invalidateOptionsMenu()
	{
		if (Build.VERSION.SDK_INT >= TiC.API_LEVEL_HONEYCOMB) {
			if (TiApplication.isUIThread()) {
				handleInvalidateOptionsMenu();
			} else {
				getMainHandler().obtainMessage(MSG_INVALIDATE_OPTIONS_MENU).sendToTarget();
			}
		}
	}

	private void handleOpenOptionsMenu()
	{
		Activity activity = getWrappedActivity();
		if (activity != null) {
			activity.openOptionsMenu();
		}
	}

	private void handleInvalidateOptionsMenu()
	{
		Activity activity = getWrappedActivity();
		if (activity != null) {
			activity.invalidateOptionsMenu();
		}
	}

	public void onResult(Activity activity, int requestCode, int resultCode, Intent data)
	{
		IntentProxy intent = null;
		if (data != null) {
			intent = new IntentProxy(data);
		}

		KrollDict event = new KrollDict();
		event.put(TiC.EVENT_PROPERTY_REQUEST_CODE, requestCode);
		event.put(TiC.EVENT_PROPERTY_RESULT_CODE, resultCode);
		event.put(TiC.EVENT_PROPERTY_INTENT, intent);
		event.put(TiC.EVENT_PROPERTY_SOURCE, this);
		this.resultCallback.callAsync(krollObject, event);
	}

	public void onError(Activity activity, int requestCode, Exception e)
	{
		KrollDict event = new KrollDict();
		event.put(TiC.EVENT_PROPERTY_REQUEST_CODE, requestCode);
		event.put(TiC.EVENT_PROPERTY_ERROR, e.getMessage());
		event.put(TiC.EVENT_PROPERTY_SOURCE, this);
		this.resultCallback.callAsync(krollObject, event);
	}

	public void release()
	{
		super.release();
		wrappedActivity = null;
	}

	@Override
	public boolean handleMessage(Message msg)
	{
		switch (msg.what) {
			case MSG_INVALIDATE_OPTIONS_MENU: {
				handleInvalidateOptionsMenu();
				return true;
			}
			case MSG_OPEN_OPTIONS_MENU: {
				handleOpenOptionsMenu();
				return true;
			}
		}
		return super.handleMessage(msg);
	}

}
