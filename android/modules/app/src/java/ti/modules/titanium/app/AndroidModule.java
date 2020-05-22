/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.app;

import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.KrollRuntime;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.proxy.ActivityProxy;
import org.appcelerator.titanium.proxy.IntentProxy;
import org.appcelerator.titanium.proxy.RProxy;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager.NameNotFoundException;

@Kroll.module(parentModule = AppModule.class)
public class AndroidModule extends KrollModule
{
	protected RProxy r;
	private static final String TAG = "App.AndroidModule";
	private int appVersionCode = -1;
	private String appVersionName;

	public AndroidModule()
	{
		super();
	}

	@Kroll.getProperty(name = "R")
	public RProxy getR()
	{
		if (r == null) {
			r = new RProxy(RProxy.RESOURCE_TYPE_APPLICATION);
		}
		return r;
	}

	// this shouldn't be called from anything other than the runtime thread
	@Kroll.method
	public ActivityProxy getTopActivity()
	{
		if (KrollRuntime.getActivityRefCount() == 0) {
			// No activity to wait for. This can be the case if, for example,
			// the Application is being started for a Service, not an Activity.
			return null;
		}
		TiApplication tiApp = TiApplication.getInstance();
		Activity activity = tiApp.getCurrentActivity();
		if (activity instanceof TiBaseActivity) {
			return ((TiBaseActivity) activity).getActivityProxy();
		} else {
			return null;
		}
	}

	@Kroll.method
	@Kroll.getProperty
	public int getAppVersionCode()
	{
		if (appVersionCode == -1) {
			initializeVersionValues();
		}
		return appVersionCode;
	}

	@Kroll.method
	@Kroll.getProperty
	public IntentProxy getLaunchIntent()
	{
		Intent intent = null;

		// First, attempt to fetch root activity's launch intent if currently open.
		// Using this intent will bring the activity to the foreground instead of creating a new activity.
		TiBaseActivity rootActivity = TiApplication.getInstance().getRootActivity();
		if (rootActivity != null) {
			intent = rootActivity.getLaunchIntent();
		}

		// If root activity is not available, then create main launcher intent from package manager.
		if (intent == null) {
			TiApplication context = TiApplication.getInstance();
			intent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
			intent.setPackage(null);
		}

		// Return the launch intent.
		return new IntentProxy(intent);
	}

	@Kroll.method
	@Kroll.getProperty
	public String getAppVersionName()
	{
		if (appVersionName == null) {
			initializeVersionValues();
		}
		return appVersionName;
	}

	private void initializeVersionValues()
	{
		PackageInfo pInfo;
		try {
			pInfo = TiApplication.getInstance().getPackageManager().getPackageInfo(
				TiApplication.getInstance().getPackageName(), 0);
			appVersionCode = pInfo.versionCode;
			appVersionName = pInfo.versionName;
		} catch (NameNotFoundException e) {
			Log.e(TAG, "Unable to get package info", e);
		}
	}

	@Override
	public String getApiName()
	{
		return "Ti.App.Android";
	}
}
