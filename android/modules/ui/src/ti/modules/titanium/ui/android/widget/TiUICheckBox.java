/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.android.widget;

import java.io.IOException;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.io.TiBaseFile;
import org.appcelerator.titanium.io.TiFileFactory;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;

import android.graphics.Bitmap;
import android.graphics.drawable.BitmapDrawable;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.widget.CheckBox;

public class TiUICheckBox extends TiUIView
{
	private static final String LCAT = "TiUICheckBox";
	private static final boolean DBG = TiConfig.LOGD;

	public TiUICheckBox(final TiViewProxy proxy) {
		super(proxy);
		if (DBG) {
			Log.d(LCAT, "Creating a checkbox");
		}

		CheckBox cb = new CheckBox(proxy.getContext()) {

			@Override
			public boolean onKeyUp(int keyCode, KeyEvent event)
			{
				if (event.getAction() == KeyEvent.ACTION_UP &&
						(keyCode == KeyEvent.KEYCODE_DPAD_CENTER || keyCode == KeyEvent.KEYCODE_ENTER))
				{
					proxy.fireEvent("click", new KrollDict());
				}
				return super.onKeyUp(keyCode, event);
			}
		};
		cb.setPadding(8, 0, 8, 0);
		cb.setGravity(Gravity.CENTER);
		setNativeView(cb);
	}

	@Override
	public void processProperties(KrollDict d)
	{
		super.processProperties(d);

		CheckBox cb = (CheckBox)getNativeView();
		if (d.containsKey("title")) {
			cb.setText(d.getString("title"));
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
		CheckBox cb = (CheckBox) getNativeView();
		if (key.equals("title")) {
			cb.setText((String) newValue);
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
	public void setOpacity(float opacity) {
		TiUIHelper.setPaintOpacity(((CheckBox)getNativeView()).getPaint(), opacity);
		super.setOpacity(opacity);
	}
	
	@Override
	public void clearOpacity(View view) {
		super.clearOpacity(view);
		((CheckBox)getNativeView()).getPaint().setColorFilter(null);
	}

	public void toggle() {
		((CheckBox) getNativeView()).toggle();
	}

	public boolean checked() {
		return ((CheckBox) getNativeView()).isChecked();
	}

	public void setChecked(boolean check) {
		((CheckBox) getNativeView()).setChecked(check);
	}
}
