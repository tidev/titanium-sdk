/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.TiUIActivityIndicator;
import android.app.Activity;

@Kroll.proxy(creatableInModule=UIModule.class, propertyAccessors = {
	"message", "value",
	"location", "min", "max",
	"messageid", "type"
})
@Kroll.dynamicApis(methods = {
	"hide", "show"
})
public class ActivityIndicatorProxy extends TiDialogProxy
{
	public ActivityIndicatorProxy()
	{
		super();
	}

	public ActivityIndicatorProxy(TiContext tiContext)
	{
		this();
	}

	@Override
	protected KrollDict getLangConversionTable() {
		KrollDict table = new KrollDict();
		table.put("message", "messageid");
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

		TiUIActivityIndicator ai = (TiUIActivityIndicator) getOrCreateView();
		ai.show(options);
	}

	@Override
	protected void handleHide(KrollDict options) {
		super.handleHide(options);

		TiUIActivityIndicator ai = (TiUIActivityIndicator) getOrCreateView();
		ai.hide(options);
	}
}
