/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.iphone;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;

@Kroll.proxy(creatableInModule=iPhoneModule.class)
public class GroupedViewProxy extends TiViewProxy
{
	private static final String LCAT = "GroupedViewProxy";

	public GroupedViewProxy(TiContext tiContext) {
		super(tiContext);
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		return null;
	}

	@Kroll.method
	public void hideStatusBar() {
		Log.w(LCAT, "hideStatusBar not valid on Android");
	}

	@Kroll.method
	public void showStatusBar() {
		Log.w(LCAT, "showStatusBar not valid on Android");
	}
}
