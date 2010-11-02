/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.android;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;
import org.appcelerator.titanium.util.TiConvert;

import ti.modules.titanium.ui.android.widget.TiUICheckBox;
import android.app.Activity;

@Kroll.proxy(creatableInModule=AndroidModule.class)
public class CheckBoxProxy extends TiViewProxy
{
	public CheckBoxProxy(TiContext tiContext)
	{
		super(tiContext);
	}

	@Override
	protected KrollDict getLangConversionTable() {
		KrollDict table = new KrollDict();
		table.put("title","titleid");
		return table;
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		return new TiUICheckBox(this);
	}

	@Kroll.method(runOnUiThread=true)
	public void toggle()
	{
		TiUICheckBox cb = (TiUICheckBox) peekView();
		if (cb != null) {
			cb.toggle();
		}
	}

	@Kroll.getProperty
	public boolean getChecked()
	{
		TiUICheckBox cb = (TiUICheckBox) peekView();
		if (cb != null) {
			return cb.checked();
		}
		return false;
	}

	@Kroll.setProperty(runOnUiThread=true) @Kroll.method(runOnUiThread=true)
	public void setChecked(Object check)
	{
		TiUICheckBox cb = (TiUICheckBox) peekView();
		if (cb != null) {
			cb.setChecked(TiConvert.toBoolean(check));
		}
	}
}
