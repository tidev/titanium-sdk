/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.android;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.searchview.TiUISearchView;
import android.app.Activity;
import android.os.Build;

@Kroll.proxy(creatableInModule = AndroidModule.class, propertyAccessors = {
	TiC.PROPERTY_ICONIFIED, TiC.PROPERTY_ICONIFIED_BY_DEFAULT, TiC.PROPERTY_HINT_TEXT, TiC.PROPERTY_VALUE })
public class SearchViewProxy extends TiViewProxy
{
	private static final String TAG = "SearchProxy";

	public SearchViewProxy()
	{
		super();
		defaultValues.put(TiC.PROPERTY_ICONIFIED_BY_DEFAULT, true);
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		if (Build.VERSION.SDK_INT >= TiC.API_LEVEL_HONEYCOMB) {
			return new TiUISearchView(this);
		}

		Log.e(TAG, "SearchView is only supported on target API 11+");
		return null;
	}
}