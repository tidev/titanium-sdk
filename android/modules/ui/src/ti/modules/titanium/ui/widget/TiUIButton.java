/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import java.io.IOException;

import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.io.TiBaseFile;
import org.appcelerator.titanium.io.TiFileFactory;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;

import android.graphics.Bitmap;
import android.graphics.ColorFilter;
import android.graphics.drawable.BitmapDrawable;
import android.view.Gravity;
import android.view.KeyEvent;
import android.widget.Button;
import android.widget.TextView;

public class TiUIButton extends TiUIView
{
	private static final String LCAT = "TiUIButton";
	private static final boolean DBG = TiConfig.LOGD;

	public TiUIButton(final TiViewProxy proxy) {
		super(proxy);
		if (DBG) {
			Log.d(LCAT, "Creating a button");
		}

		Button btn = new Button(proxy.getContext()) {

			@Override
			public boolean onKeyUp(int keyCode, KeyEvent event)
			{
				if (event.getAction() == KeyEvent.ACTION_UP &&
						(keyCode == KeyEvent.KEYCODE_DPAD_CENTER || keyCode == KeyEvent.KEYCODE_ENTER))
				{
					proxy.fireEvent("click", new TiDict());
				}
				return super.onKeyUp(keyCode, event);
			}
		};
		btn.setPadding(8, 0, 8, 0);
		btn.setGravity(Gravity.CENTER);
		setNativeView(btn);
	}

	@Override
	public void processProperties(TiDict d)
	{
		super.processProperties(d);

		Button btn = (Button)getNativeView();
		if (d.containsKey("image")) {
			Object value = d.get("image");
			if (value instanceof String) {
				try {
					String url = getProxy().getTiContext().resolveUrl(null, (String)value);
					TiBaseFile file = TiFileFactory.createTitaniumFile(getProxy().getTiContext(), new String[] { url }, false);
					Bitmap bitmap = TiUIHelper.createBitmap(file.getInputStream());

					btn.setBackgroundDrawable(new BitmapDrawable(bitmap));
				} catch (IOException e) {
					Log.e(LCAT, "Error setting button image", e);
				}
			}
		}
		if (d.containsKey("title")) {
			btn.setText(d.getString("title"));
		}
		if (d.containsKey("color")) {
			btn.setTextColor(TiConvert.toColor(d, "color"));
		}
		if (d.containsKey("font")) {
			TiUIHelper.styleText(btn, d.getTiDict("font"));
		}
		if (d.containsKey("textAlign")) {
			String textAlign = d.getString("textAlign");
			TiUIHelper.setAlignment(btn, textAlign, null);
		}
		if (d.containsKey("verticalAlign")) {
			String verticalAlign = d.getString("verticalAlign");
			TiUIHelper.setAlignment(btn, null, verticalAlign);
		}
		btn.invalidate();
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, TiProxy proxy)
	{
		if (DBG) {
			Log.d(LCAT, "Property: " + key + " old: " + oldValue + " new: " + newValue);
		}
		Button btn = (Button) getNativeView();
		if (key.equals("title")) {
			btn.setText((String) newValue);
		} else if (key.equals("color")) {
			btn.setTextColor(TiConvert.toColor(TiConvert.toString(newValue)));
		} else if (key.equals("font")) {
			TiUIHelper.styleText(btn, (TiDict) newValue);
		} else if (key.equals("textAlign")) {
			TiUIHelper.setAlignment(btn, TiConvert.toString(newValue), null);
			btn.requestLayout();
		} else if (key.equals("verticalAlign")) {
			TiUIHelper.setAlignment(btn, null, TiConvert.toString(newValue));
			btn.requestLayout();
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}
	
	@Override
	public void setOpacity(float opacity) {
		TiUIHelper.setPaintOpacity(((Button)getNativeView()).getPaint(), opacity);
		super.setOpacity(opacity);
	}
	
	@Override
	public void clearOpacity() {
		super.clearOpacity();
		((Button)getNativeView()).getPaint().setColorFilter(null);
	}
}
