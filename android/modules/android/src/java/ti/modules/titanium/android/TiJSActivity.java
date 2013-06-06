/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.android;

import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiLaunchActivity;
import org.appcelerator.titanium.proxy.ActivityProxy;
import org.appcelerator.titanium.proxy.TiActivityWindowProxy;
import org.appcelerator.titanium.util.TiBindingHelper;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIActivityWindow;

import android.content.Intent;

public abstract class TiJSActivity extends TiLaunchActivity
{
	protected String url;
	protected TiUIActivityWindow activityWindow;

	public TiJSActivity(ActivityProxy proxy)
	{
		proxy.setActivity(this);
		activityProxy = proxy;
		if (proxy.hasProperty(TiC.PROPERTY_URL)) {
			this.url = TiConvert.toString(proxy.getProperty(TiC.PROPERTY_URL));
		}
	}

	public TiJSActivity(String url)
	{
		this.url = url;
	}

	@Override
	public String getUrl()
	{
		if (url == null) {
			Intent intent = getIntent();
			if (intent != null && intent.getDataString() != null) {
				url = intent.getDataString();
			} else {
				throw new IllegalStateException("Activity url required.");
			}
		}
		return url;
	}

	@Override
	protected void contextCreated()
	{
		super.contextCreated();
		TiActivityWindowProxy window = new TiActivityWindowProxy();
		window.setActivity(this);
		TiBindingHelper.bindCurrentWindow(window);
		setWindowProxy(window);
	}

	@Override
	protected void scriptLoaded()
	{
		super.scriptLoaded();
		activityWindow.open();
	}

	@Override
	protected void windowCreated()
	{
		// Set the layout proxy here since it's not ready when we indirectly call it inside contextCreated()
		setLayoutProxy(window);

		// The UIWindow needs to be created before we run the script
		activityWindow = new TiUIActivityWindow((TiActivityWindowProxy)window, this, getLayout());
		super.windowCreated();
	}

	@Override
	protected boolean shouldFinishRootActivity()
	{
		return getIntentBoolean(TiC.PROPERTY_EXIT_ON_CLOSE, false) || super.shouldFinishRootActivity();
	}

	@Override
	public boolean isJSActivity()
	{
		return true;
	}

}
