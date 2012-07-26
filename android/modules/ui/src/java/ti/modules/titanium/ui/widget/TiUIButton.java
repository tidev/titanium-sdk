/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import java.io.IOException;
import java.util.HashMap;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiConfig;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.io.TiBaseFile;
import org.appcelerator.titanium.io.TiFileFactory;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;

import android.graphics.Bitmap;
import android.graphics.Rect;
import android.graphics.drawable.BitmapDrawable;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;

public class TiUIButton extends TiUIView
{
	private static final String LCAT = "TiUIButton";
	private static final boolean DBG = TiConfig.LOGD;

	private int shadowColor;
	private int shadowDx;
	private int shadowDy;
	private Rect titlePadding;

	public TiUIButton(final TiViewProxy proxy) {
		super(proxy);
		if (DBG) {
			Log.d(LCAT, "Creating a button");
		}
		titlePadding = new Rect();
		Button btn = new Button(proxy.getActivity());
		btn.setPadding(titlePadding.left, titlePadding.top, titlePadding.right, titlePadding.bottom);
		btn.setGravity(Gravity.CENTER);
		setNativeView(btn);
	}

	@Override
	public void processProperties(KrollDict d)
	{
		super.processProperties(d);

		Button btn = (Button) getNativeView();
		if (d.containsKey(TiC.PROPERTY_IMAGE)) {
			Object value = d.get(TiC.PROPERTY_IMAGE);
			Bitmap bitmap = null;
			if (value instanceof String) {
				try {
					String url = getProxy().resolveUrl(null, (String) value);
					TiBaseFile file = TiFileFactory.createTitaniumFile(new String[] { url }, false);
					bitmap = TiUIHelper.createBitmap(file.getInputStream());
				} catch (IOException e) {
					Log.e(LCAT, "Error setting button image", e);
				}
			} else if (value instanceof TiBlob) {
				bitmap = TiUIHelper.createBitmap(((TiBlob) value).getInputStream());
			}

			if (bitmap != null) {
				BitmapDrawable image = new BitmapDrawable(btn.getResources(), bitmap);
				btn.setCompoundDrawablesWithIntrinsicBounds(image, null, null, null);
			}
		}
		if (d.containsKey(TiC.PROPERTY_TITLE)) {
			btn.setText(d.getString(TiC.PROPERTY_TITLE));
		}
		if (d.containsKey(TiC.PROPERTY_COLOR)) {
			btn.setTextColor(TiConvert.toColor(d, TiC.PROPERTY_COLOR));
		}
		if (d.containsKey(TiC.PROPERTY_FONT)) {
			TiUIHelper.styleText(btn, d.getKrollDict(TiC.PROPERTY_FONT));
		}
		if (d.containsKey(TiC.PROPERTY_TEXT_ALIGN)) {
			String textAlign = d.getString(TiC.PROPERTY_TEXT_ALIGN);
			TiUIHelper.setAlignment(btn, textAlign, null);
		}
		if (d.containsKey(TiC.PROPERTY_VERTICAL_ALIGN)) {
			String verticalAlign = d.getString(TiC.PROPERTY_VERTICAL_ALIGN);
			TiUIHelper.setAlignment(btn, null, verticalAlign);
		}
		if (d.containsKey(TiC.PROPERTY_TITLE_PADDING_LEFT)) {
			titlePadding.left = TiConvert.toInt(d,0);
			btn.setPadding(titlePadding.left, titlePadding.top, titlePadding.right, titlePadding.bottom);
		}
		if (d.containsKey(TiC.PROPERTY_TITLE_PADDING_RIGHT)) {
			titlePadding.right = TiConvert.toInt(d,0);
			btn.setPadding(titlePadding.left, titlePadding.top, titlePadding.right, titlePadding.bottom);
		}
		if (d.containsKey(TiC.PROPERTY_TITLE_PADDING_TOP)) {
			titlePadding.top = TiConvert.toInt(d,0);
			btn.setPadding(titlePadding.left, titlePadding.top, titlePadding.right, titlePadding.bottom);
		}
		if (d.containsKey(TiC.PROPERTY_TITLE_PADDING_BOTTOM)) {
			titlePadding.bottom = TiConvert.toInt(d,0);
			btn.setPadding(titlePadding.left, titlePadding.top, titlePadding.right, titlePadding.bottom);
		}
		if (d.containsKey(TiC.PROPERTY_SHADOW_COLOR)) {
			shadowColor = TiConvert.toColor(d, TiC.PROPERTY_SHADOW_COLOR);
			btn.setShadowLayer(1, shadowDx, shadowDy, shadowColor);
		}
		if (d.containsKey(TiC.PROPERTY_SHADOW_OFFSET)) {
			KrollDict value = d.getKrollDict(TiC.PROPERTY_SHADOW_OFFSET);
			shadowDx = value.getInt(TiC.PROPERTY_X);
			shadowDy = value.getInt(TiC.PROPERTY_Y);
			btn.setShadowLayer(1, shadowDx, shadowDy, shadowColor);
		}
		btn.invalidate();
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		if (DBG) {
			Log.d(LCAT, "Property: " + key + " old: " + oldValue + " new: " + newValue);
		}
		Button btn = (Button) getNativeView();
		if (key.equals(TiC.PROPERTY_TITLE)) {
			btn.setText((String) newValue);
		} else if (key.equals(TiC.PROPERTY_COLOR)) {
			btn.setTextColor(TiConvert.toColor(TiConvert.toString(newValue)));
		} else if (key.equals(TiC.PROPERTY_FONT)) {
			TiUIHelper.styleText(btn, (HashMap) newValue);
		} else if (key.equals(TiC.PROPERTY_TEXT_ALIGN)) {
			TiUIHelper.setAlignment(btn, TiConvert.toString(newValue), null);
			btn.requestLayout();
		} else if (key.equals(TiC.PROPERTY_VERTICAL_ALIGN)) {
			TiUIHelper.setAlignment(btn, null, TiConvert.toString(newValue));
			btn.requestLayout();
		} else if (key.equals(TiC.PROPERTY_TITLE_PADDING_LEFT)) {
			titlePadding.left = TiConvert.toInt(newValue);
			btn.setPadding(titlePadding.left, titlePadding.top, titlePadding.right, titlePadding.bottom);
			btn.requestLayout();
		} else if (key.equals(TiC.PROPERTY_TITLE_PADDING_RIGHT)) {
			titlePadding.right = TiConvert.toInt(newValue);
			btn.setPadding(titlePadding.left, titlePadding.top, titlePadding.right, titlePadding.bottom);
			btn.requestLayout();
		} else if (key.equals(TiC.PROPERTY_TITLE_PADDING_TOP)) {
			titlePadding.top = TiConvert.toInt(newValue);
			btn.setPadding(titlePadding.left, titlePadding.top, titlePadding.right, titlePadding.bottom);
			btn.requestLayout();
		} else if (key.equals(TiC.PROPERTY_TITLE_PADDING_BOTTOM)) {
			titlePadding.bottom = TiConvert.toInt(newValue);
			btn.setPadding(titlePadding.left, titlePadding.top, titlePadding.right, titlePadding.bottom);
			btn.requestLayout();
		} else if (key.equals(TiC.PROPERTY_SHADOW_COLOR)) {
			shadowColor = TiConvert.toColor((String) newValue);
			btn.setShadowLayer(1, shadowDx, shadowDy, shadowColor);
		} else if (key.equals(TiC.PROPERTY_SHADOW_OFFSET)) {
			shadowDx = TiConvert.toInt(((HashMap) newValue).get(TiC.PROPERTY_X));
			shadowDy = TiConvert.toInt(((HashMap) newValue).get(TiC.PROPERTY_Y));
			btn.setShadowLayer(1, shadowDx, shadowDy, shadowColor);
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
	public void clearOpacity(View view) {
		super.clearOpacity(view);
		((Button)getNativeView()).getPaint().setColorFilter(null);
	}
}
