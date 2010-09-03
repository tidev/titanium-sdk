/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.ui;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConvert;

@Kroll.proxy(creatableInModule="UI")
public class PickerRowProxy extends KrollProxy 
{
	private static final String LCAT = "PickerRowProxy";

	public PickerRowProxy(TiContext tiContext)
	{
		super(tiContext);
	}

	@Override
	public String toString()
	{
		String text = "[PickerRow]";
		if (hasProperty("title")) {
			text = TiConvert.toString(getProperty("title"));
		}
		return text;
	}
	
	/*
	 * For mimicking a ViewProxy, which is what this should be.
	 * When we allow complex content (views) inside row, we'll
	 * change to extend TiViewProxy and these won't be necessary.
	 */
	public void add(Object child) 
	{
		Log.w(LCAT, "PickerRow does not support child controls");
	}
	public void remove(Object child) 
	{
		Log.w(LCAT, "PickerRow does not support child controls");
	}
}
