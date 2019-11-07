/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;

import ti.modules.titanium.ui.widget.TiUIDialog;
// clang-format off
@Kroll.proxy(creatableInModule = UIModule.class,
	propertyAccessors = {
		TiC.PROPERTY_ANDROID_VIEW,
		TiC.PROPERTY_CANCEL,
		TiC.PROPERTY_OPTIONS,
		TiC.PROPERTY_SELECTED_INDEX,
		TiC.PROPERTY_TITLE,
		TiC.PROPERTY_TITLEID,
		TiC.PROPERTY_PERSISTENT
})
// clang-format on
public class OptionDialogProxy extends TiDialogProxy
{
	public OptionDialogProxy()
	{
		super();
	}

	@Override
	protected KrollDict getLangConversionTable()
	{
		KrollDict table = new KrollDict();
		table.put(TiC.PROPERTY_TITLE, TiC.PROPERTY_TITLEID);
		return table;
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		return new TiUIDialog(this);
	}

	@Override
	protected void handleShow(KrollDict options)
	{
		super.handleShow(options);

		TiUIDialog d = (TiUIDialog) getOrCreateView();
		d.show(options);
	}

	@Override
	protected void handleHide(KrollDict options)
	{
		super.handleHide(options);

		TiUIDialog d = (TiUIDialog) getOrCreateView();
		d.hide(options);
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.OptionDialog";
	}
}
