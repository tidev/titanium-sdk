/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import java.util.Map;

import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import android.widget.Toast;

public class TiUINotification extends TiUIView
{
	private static final String LCAT = "TiUINotifier";
	private static final boolean DBG = TiConfig.LOGD;

	private Toast toast;

	public TiUINotification(TiViewProxy proxy) {
		super(proxy);
		if (DBG) {
			Log.d(LCAT, "Creating a notifier");
		}
		toast = Toast.makeText(proxy.getTiContext().getActivity(), "", Toast.LENGTH_SHORT);
	}

	@Override
	public void processProperties(TiDict d)
	{
		
		float horizontalMargin = toast.getHorizontalMargin();
		float verticalMargin = toast.getVerticalMargin();
		int offsetX = toast.getXOffset();
		int offsetY = toast.getYOffset();		
		int gravity = toast.getGravity();		
		
		if (proxy.hasDynamicValue("duration")) {
			// Technically this should check if the duration is one of the 2 possible options
			int duration = TiConvert.toInt(proxy.getDynamicValue("duration"));
			toast.setDuration(duration);
		}
		
		//float horizontalMargin, float verticalMargin
		if (proxy.hasDynamicValue("horizontalMargin")) {
			horizontalMargin = TiConvert.toFloat(proxy.getDynamicValue("horizontalMargin"));
		}
		
		if (proxy.hasDynamicValue("verticalMargin")) {
			verticalMargin = TiConvert.toFloat(proxy.getDynamicValue("verticalMargin"));
		}
		
		toast.setMargin(horizontalMargin, verticalMargin);		
		
		if (proxy.hasDynamicValue("offsetX")) {
			offsetX = TiConvert.toInt(proxy.getDynamicValue("offsetX"));
		}

		if (proxy.hasDynamicValue("offsetY")) {
			offsetY = TiConvert.toInt(proxy.getDynamicValue("offsetY"));
		}

		// Left gravity off from the docco - not sure what your general opinion is about specifying the gravity
		// So for now this is a hidden property
		if (proxy.hasDynamicValue("gravity")) {
			gravity = TiConvert.toInt(proxy.getDynamicValue("gravity"));
		}
		
		toast.setGravity(gravity, offsetX, offsetY);
				
		super.processProperties(d);
	}


	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, TiProxy proxy)
	{
		// Not super efficient but better code reuse
		TiDict d = new TiDict();
		d.put(key, newValue);
		processProperties(d);

		if (DBG) {
			Log.d(LCAT, "PropertyChanged - Property '" + key + "' changed to '" + newValue + "' from '" + oldValue + "'");
		}

	}

	public void show(TiDict options) {

		toast.setText((String) proxy.getDynamicValue("message"));
		toast.show();
	}

	public void hide(TiDict options) {
		toast.cancel();
	}
}
