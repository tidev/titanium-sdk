/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.android.AndroidModule;

import android.widget.CheckBox;
import android.widget.CompoundButton;
import android.widget.CompoundButton.OnCheckedChangeListener;
import android.widget.ToggleButton;

public class TiUISwitch extends TiUIView
	implements OnCheckedChangeListener
{
	private static final String LCAT = "TiUISwitch";
	private static final boolean DBG = TiConfig.LOGD;
	
	public TiUISwitch(TiViewProxy proxy) {
		super(proxy);
		if (DBG) {
			Log.d(LCAT, "Creating a switch");
		}

		propertyChanged("style", null, proxy.getProperty("style"), proxy);
	}

	@Override
	public void processProperties(KrollDict d)
	{
		super.processProperties(d);

		CompoundButton cb = (CompoundButton) getNativeView();
		if (d.containsKey("style")) {
			setStyle(TiConvert.toInt(d, "style"));
		}
		if (d.containsKey("title") && cb.getClass().equals(CheckBox.class)) {
			cb.setText(TiConvert.toString(d, "title"));
		}
		if (d.containsKey("titleOff") && cb.getClass().equals(ToggleButton.class)) {
			((ToggleButton) cb).setTextOff(TiConvert.toString(d, "titleOff"));
		}
		if (d.containsKey("titleOn") && cb.getClass().equals(ToggleButton.class)) {
			((ToggleButton) cb).setTextOn(TiConvert.toString(d, "titleOn"));
		}
		if (d.containsKey("value")) {
			cb.setChecked(TiConvert.toBoolean(d, "value"));
		}
		if (d.containsKey("color")) {
			cb.setTextColor(TiConvert.toColor(d, "color"));
		}
		if (d.containsKey("font")) {
			TiUIHelper.styleText(cb, d.getKrollDict("font"));
		}
		if (d.containsKey("textAlign")) {
			String textAlign = d.getString("textAlign");
			TiUIHelper.setAlignment(cb, textAlign, null);
		}
		if (d.containsKey("verticalAlign")) {
			String verticalAlign = d.getString("verticalAlign");
			TiUIHelper.setAlignment(cb, null, verticalAlign);
		}
		cb.invalidate();
	}


	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		if (DBG) {
			Log.d(LCAT, "Property: " + key + " old: " + oldValue + " new: " + newValue);
		}
		
		CompoundButton cb = (CompoundButton) getNativeView();
		if (key.equals("style")) {
			setStyle(TiConvert.toInt(newValue));
		} else if (key.equals("title") && cb.getClass().equals(CheckBox.class)) {
			cb.setText((String) newValue);
		} else if (key.equals("titleOff") && cb.getClass().equals(ToggleButton.class)) {
			((ToggleButton) cb).setTextOff((String) newValue);
		} else if (key.equals("titleOn") && cb.getClass().equals(ToggleButton.class)) {
			((ToggleButton) cb).setTextOff((String) newValue);
		} else if (key.equals("value")) {
			cb.setChecked(TiConvert.toBoolean(newValue));
		} else if (key.equals("color")) {
			cb.setTextColor(TiConvert.toColor(TiConvert.toString(newValue)));
		} else if (key.equals("font")) {
			TiUIHelper.styleText(cb, (KrollDict) newValue);
		} else if (key.equals("textAlign")) {
			TiUIHelper.setAlignment(cb, TiConvert.toString(newValue), null);
			cb.requestLayout();
		} else if (key.equals("verticalAlign")) {
			TiUIHelper.setAlignment(cb, null, TiConvert.toString(newValue));
			cb.requestLayout();
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	@Override
	public void onCheckedChanged(CompoundButton btn, boolean value) {
		KrollDict data = new KrollDict();
		data.put("value", value);

		proxy.setProperty("value", value);
		proxy.fireEvent("change", data);
	}
	
	protected void setStyle(int style) {
		CompoundButton btn;
		switch (style) {
		case AndroidModule.SWITCH_STYLE_CHECKBOX:
			btn = new CheckBox(proxy.getContext());
			break;
			
		case AndroidModule.SWITCH_STYLE_TOGGLEBUTTON:
			btn = new ToggleButton(proxy.getContext());
			break;

		default:
			return;
		}
		
		setNativeView(btn);
		KrollDict d = proxy.getProperties();
		d.remove("style"); // Avoid recursion
		processProperties(d);
		btn.setOnCheckedChangeListener(this);
	}
}
