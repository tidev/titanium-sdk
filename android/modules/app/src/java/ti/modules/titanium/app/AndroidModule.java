/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.app;

import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.ActivityProxy;
import org.appcelerator.titanium.proxy.RProxy;

import android.app.Activity;

@Kroll.module(parentModule=AppModule.class)
public class AndroidModule extends KrollModule
{
	private static final String TAG = "AndroidModule";

	protected RProxy r;


	public AndroidModule()
	{
		super();
	}

	public AndroidModule(TiContext context)
	{
		this();
	}

	@Kroll.getProperty(name="R")
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
		TiApplication tiApp = TiApplication.getInstance();
		Activity activity = tiApp.getCurrentActivity();
		if (activity == null || !(activity instanceof TiBaseActivity)) {
			try {
				tiApp.rootActivityLatch.await();
				activity = tiApp.getRootActivity();
			} catch (InterruptedException e) {
				Log.e(TAG, "Interrupted awaiting rootActivityLatch");
			}
		}

		if (activity instanceof TiBaseActivity) {
			return ((TiBaseActivity)activity).getActivityProxy();
		} else {
			return null;
		}
	}
}

