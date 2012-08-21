/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.android;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.TiDialogProxy;
import ti.modules.titanium.ui.widget.TiUIProgressIndicator;
import android.app.Activity;

@Kroll.proxy(creatableInModule=AndroidModule.class, propertyAccessors = {
	TiC.PROPERTY_MESSAGE,
	TiC.PROPERTY_MESSAGEID,
	TiC.PROPERTY_VALUE,
	TiC.PROPERTY_LOCATION,
	TiC.PROPERTY_TYPE,
	TiC.PROPERTY_MIN,
	TiC.PROPERTY_MAX,
	TiC.PROPERTY_CANCELABLE
})
@Kroll.dynamicApis(methods = {
	"hide", "show"
})
public class ProgressIndicatorProxy extends TiDialogProxy
{
	public ProgressIndicatorProxy()
	{
		super();
	}

	public ProgressIndicatorProxy(TiContext tiContext)
	{
		this();
	}

	@Override
	protected KrollDict getLangConversionTable() {
		KrollDict table = new KrollDict();
		table.put(TiC.PROPERTY_MESSAGE, TiC.PROPERTY_MESSAGEID);
		return table;
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		return new TiUIProgressIndicator(this);
	}

	@Override
	protected void handleShow(KrollDict options) {
		super.handleShow(options);

		TiUIProgressIndicator ai = (TiUIProgressIndicator) getOrCreateView();
		ai.show(options);
	}

	@Override
	protected void handleHide(KrollDict options) {
		super.handleHide(options);

		TiUIProgressIndicator ai = (TiUIProgressIndicator) getOrCreateView();
		ai.hide(options);
	}
}
