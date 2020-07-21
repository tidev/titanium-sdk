/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.picker.TiUISpinnerRow;
import android.app.Activity;

@Kroll.proxy(creatableInModule = UIModule.class)
public class PickerRowProxy extends TiViewProxy
{
	private static final String TAG = "PickerRowProxy";
	private String title = "[PickerRow]";
	private PickerRowListener rowListener = null;

	public PickerRowProxy()
	{
		super();
	}

	@Kroll.method
	@Kroll.getProperty
	public String getColor()
	{
		return (String) getProperty(TiC.PROPERTY_COLOR);
	}

	@Kroll.method
	@Kroll.setProperty
	public void setColor(String color)
	{
		setPropertyAndFire(TiC.PROPERTY_COLOR, color);
		if (rowListener != null) {
			rowListener.rowChanged(this);
		}
	}

	@Kroll.method
	@Kroll.getProperty
	public String getTitle()
	{
		return toString();
	}

	@Kroll.method
	@Kroll.setProperty
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
	public void add(Object args)
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

	public interface PickerRowListener {
		void rowChanged(PickerRowProxy row);
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.PickerRow";
	}
}
