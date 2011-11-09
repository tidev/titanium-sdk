/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.util.TiUIHelper.CurrentActivityListener;

import android.app.Activity;

@Kroll.proxy(propertyAccessors={
	"title", "titleid", "message",
	"buttonNames", "androidView",
	"options", "selectedIndex", "cancel"
}, parentModule=UIModule.class)
public abstract class TiDialogProxy extends TiViewProxy
{
	protected boolean showing = false;

	public TiDialogProxy()
	{
		super();
	}

	public TiDialogProxy(TiContext tiContext)
	{
		this();
	}

	@Override
	public void show(final KrollDict options)
	{
		showing = true;
		TiUIHelper.waitForCurrentActivity(new CurrentActivityListener() {
			@Override
			public void onCurrentActivityReady(Activity activity)
			{
				if (showing) {
					TiDialogProxy.super.show(options);
				}
			}
		});
	}

	@Override
	public void hide(KrollDict options)
	{
		showing = false;
		super.hide(options);
	}
}
