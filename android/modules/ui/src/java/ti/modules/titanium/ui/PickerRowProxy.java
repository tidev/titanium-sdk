/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.picker.TiUISpinnerRow;
import android.app.Activity;

@Kroll.proxy(creatableInModule=UIModule.class)
public class PickerRowProxy extends TiViewProxy
{
	private static final String TAG = "PickerRowProxy";
	private String title = "[PickerRow]";
	private PickerRowListener rowListener = null;

	public PickerRowProxy()
	{
		super();
	}

	public PickerRowProxy(TiContext tiContext)
	{
		this();
	}

	@Kroll.getProperty @Kroll.method
	public String getTitle()
	{
		return toString();
	}

	@Kroll.setProperty @Kroll.method
	public void setTitle(String value)
	{
		title = value;
		if (rowListener != null) {
			rowListener.rowChanged(this);
		}
	}

	@Override
	public String toString()
	{
		return title;
	}
	
	public void setRowListener(PickerRowListener listener)
	{
		rowListener = listener;
	}
	
	@Override
	public void add(TiViewProxy child)
	{
		Log.w(TAG, "PickerRow does not support child controls");
	}
	@Override
	public void remove(TiViewProxy child)
	{
		Log.w(TAG, "PickerRow does not support child controls");
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		return new TiUISpinnerRow(this);
	}

	@Override
	public void handleCreationDict(KrollDict options)
	{
		super.handleCreationDict(options);
		if (options.containsKey("title")) {
			title = TiConvert.toString(options, "title");
		}
	}
	
	public interface PickerRowListener
	{
		void rowChanged(PickerRowProxy row);
	}
}
