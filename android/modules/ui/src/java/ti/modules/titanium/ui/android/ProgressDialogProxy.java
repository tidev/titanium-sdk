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

import ti.modules.titanium.ui.android.AndroidModule;
import ti.modules.titanium.ui.TiDialogProxy;
import ti.modules.titanium.ui.widget.TiUIProgressDialog;
import android.app.Activity;

@Kroll.proxy(creatableInModule=AndroidModule.class, propertyAccessors = {
	"message", "value",
	"location", "min", "max",
	"messageid", "type",
	TiC.PROPERTY_CANCELABLE
})
@Kroll.dynamicApis(methods = {
	"hide", "show"
})
public class ProgressDialogProxy extends TiDialogProxy
{
	public ProgressDialogProxy()
	{
		super();
	}

	public ProgressDialogProxy(TiContext tiContext)
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
		return new TiUIProgressDialog(this);
	}

	@Override
	protected void handleShow(KrollDict options) {
		super.handleShow(options);

		TiUIProgressDialog ai = (TiUIProgressDialog) getOrCreateView();
		ai.show(options);
	}

	@Override
	protected void handleHide(KrollDict options) {
		super.handleHide(options);

		TiUIProgressDialog ai = (TiUIProgressDialog) getOrCreateView();
		ai.hide(options);
	}
}
