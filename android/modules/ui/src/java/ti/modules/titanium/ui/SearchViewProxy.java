/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.searchview.TiUISearchView;
import android.app.Activity;

@Kroll.proxy(creatableInModule = UIModule.class, propertyAccessors = {
	TiC.PROPERTY_ICONIFIED, TiC.PROPERTY_ICONIFIED_BY_DEFAULT, TiC.PROPERTY_HINT_TEXT, TiC.PROPERTY_VALUE })
public class SearchViewProxy extends TiViewProxy {

	private static final String TAG = "SearchProxy";

	public SearchViewProxy() {
		super();
		defaultValues.put(TiC.PROPERTY_ICONIFIED_BY_DEFAULT, true);
	}

	@Override
	public TiUIView createView(Activity activity) {
		TiUIView view = new TiUISearchView(this);
		view.getLayoutParams().autoFillsHeight = true;
		view.getLayoutParams().autoFillsWidth = true;
		return view;
	}


}