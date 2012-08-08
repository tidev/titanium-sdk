/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import android.widget.Toast;

public class TiUINotification extends TiUIView
{
	private static final String TAG = "TiUINotifier";

	private Toast toast;

	public TiUINotification(TiViewProxy proxy) {
		super(proxy);
		Log.d(TAG, "Creating a notifier", Log.DEBUG_MODE);
		toast = Toast.makeText(proxy.getActivity(), "", Toast.LENGTH_SHORT);
	}

	@Override
	public void processProperties(KrollDict d)
	{
		
		float horizontalMargin = toast.getHorizontalMargin();
		float verticalMargin = toast.getVerticalMargin();
		int offsetX = toast.getXOffset();
		int offsetY = toast.getYOffset();		
		int gravity = toast.getGravity();		
		
		if (proxy.hasProperty("duration")) {
			// Technically this should check if the duration is one of the 2 possible options
			int duration = TiConvert.toInt(proxy.getProperty("duration"));
			toast.setDuration(duration);
		}
		
		//float horizontalMargin, float verticalMargin
		if (proxy.hasProperty("horizontalMargin")) {
			horizontalMargin = TiConvert.toFloat(proxy.getProperty("horizontalMargin"));
		}
		
		if (proxy.hasProperty("verticalMargin")) {
			verticalMargin = TiConvert.toFloat(proxy.getProperty("verticalMargin"));
		}
		
		toast.setMargin(horizontalMargin, verticalMargin);		
		
		if (proxy.hasProperty("offsetX")) {
			offsetX = TiConvert.toInt(proxy.getProperty("offsetX"));
		}

		if (proxy.hasProperty("offsetY")) {
			offsetY = TiConvert.toInt(proxy.getProperty("offsetY"));
		}

		// Left gravity off from the docco - not sure what your general opinion is about specifying the gravity
		// So for now this is a hidden property
		if (proxy.hasProperty("gravity")) {
			gravity = TiConvert.toInt(proxy.getProperty("gravity"));
		}
		
		toast.setGravity(gravity, offsetX, offsetY);
				
		super.processProperties(d);
	}


	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		// Not super efficient but better code reuse
		KrollDict d = new KrollDict();
		d.put(key, newValue);
		processProperties(d);

		Log.d(TAG, "PropertyChanged - Property '" + key + "' changed to '" + newValue + "' from '" + oldValue + "'",
			Log.DEBUG_MODE);

	}

	public void show(KrollDict options) {

		toast.setText((String) proxy.getProperty("message"));
		toast.show();
	}

	public void hide(KrollDict options) {
		toast.cancel();
	}
}
