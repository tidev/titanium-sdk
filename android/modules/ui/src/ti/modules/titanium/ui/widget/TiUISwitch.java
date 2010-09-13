/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import android.view.View;
import android.view.View.OnClickListener;
import android.widget.ToggleButton;

public class TiUISwitch extends TiUIView
	implements OnClickListener
{
	private static final String LCAT = "TiUISwitch";
	private static final boolean DBG = TiConfig.LOGD;

	public TiUISwitch(TiViewProxy proxy) {
		super(proxy);
		if (DBG) {
			Log.d(LCAT, "Creating a switch");
		}
		ToggleButton btn = new ToggleButton(proxy.getContext());
		btn.setOnClickListener(this);
		setNativeView(btn);
	}


	@Override
	public void processProperties(TiDict d)
	{
		super.processProperties(d);

		ToggleButton btn = (ToggleButton) getNativeView();
		if (d.containsKey("value")) {
			btn.setChecked(TiConvert.toBoolean(d, "value"));
		}
	}


	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, TiProxy proxy)
	{
		if (DBG) {
			Log.d(LCAT, "Property: " + key + " old: " + oldValue + " new: " + newValue);
		}
		ToggleButton btn = (ToggleButton) getNativeView();
		if (key.equals("value")) {
			btn.setChecked((Boolean) newValue);
			onClick(nativeView);
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	public void onClick(View v) {
		TiDict data = new TiDict();
		ToggleButton btn = (ToggleButton) v;
		boolean isChecked = btn.isChecked();
		data.put("value", isChecked);
		proxy.internalSetDynamicValue("value", isChecked, false);
		proxy.fireEvent("change", data);
	}
}
