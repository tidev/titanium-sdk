/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.ui.widget.picker;

import kankan.wheel.widget.WheelView;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

public class TiUISpinner extends TiUIView
		implements WheelView.OnItemSelectedListener
{
	private boolean ignoreItemSelection = false;
	
	public TiUISpinner(TiViewProxy proxy)
	{
		super(proxy);
		createNativeView();
	}
	
	private void createNativeView()
	{
		WheelView view = new WheelView(proxy.getContext());
		view.setAdapter(new TextWheelAdapter(new Object[] {"Hello", "Goodbye"}));
		setNativeView(view);
		/* TODO LinearLayout layout = new LinearLayout(proxy.getContext());
		layout.setOrientation(LinearLayout.HORIZONTAL);
		layout.addView(hoursWheel);
		layout.addView(minutesWheel);
		setNativeView(layout);
		*/
		
	}
	
	@Override
	public void processProperties(KrollDict d) {
		super.processProperties(d);
	}
	
	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue,
			KrollProxy proxy)
	{
		super.propertyChanged(key, oldValue, newValue, proxy);
	}
	
	@Override
	public void onItemSelected(WheelView view, int index)
	{
		if (ignoreItemSelection) {
			return;
		}
	}

}
