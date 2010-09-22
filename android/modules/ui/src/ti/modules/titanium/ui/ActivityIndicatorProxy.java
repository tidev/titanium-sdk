/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.TiUIActivityIndicator;
import android.app.Activity;

@Kroll.proxy(creatableInModule=UIModule.class)
public class ActivityIndicatorProxy extends TiViewProxy
{
	public ActivityIndicatorProxy(TiContext tiContext)
	{
		super(tiContext);
	}

	@Override
	protected KrollDict getLangConversionTable() {
		KrollDict table = new KrollDict();
		table.put("message","messageid");
		return table;
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		return new TiUIActivityIndicator(this);
	}

	@Override
	protected void handleShow(KrollDict options) {
		super.handleShow(options);

		TiUIActivityIndicator ai = (TiUIActivityIndicator) getView(getTiContext().getActivity());
		ai.show(options);
	}

	@Override
	protected void handleHide(KrollDict options) {
		super.handleHide(options);

		TiUIActivityIndicator ai = (TiUIActivityIndicator) getView(getTiContext().getActivity());
		ai.hide(options);
	}
}
