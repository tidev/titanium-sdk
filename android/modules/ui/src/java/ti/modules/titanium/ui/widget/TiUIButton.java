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
import android.graphics.drawable.Drawable;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;

public class TiUIButton extends TiUIView
{
	private static final String TAG = "TiUIButton";

	private int shadowColor;
	private int shadowDx;
	private int shadowDy;
	private Rect titlePadding;

	public TiUIButton(final TiViewProxy proxy)
	{
		super(proxy);
		titlePadding = new Rect();
		titlePadding.left = 8;
		titlePadding.right = 8;
		Log.d(TAG, "Creating a button", Log.DEBUG_MODE);
		Button btn = new Button(proxy.getActivity())
		{
			@Override
			protected void onLayout(boolean changed, int left, int top, int right, int bottom)
			{
				super.onLayout(changed, left, top, right, bottom);
				TiUIHelper.firePostLayoutEvent(proxy);
			}
		};
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
					Log.e(TAG, "Error setting button image", e);
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
		if (d.containsKey(TiC.PROPERTY_OPACITY)) {
			setOpacityForButton(TiConvert.toFloat(d, TiC.PROPERTY_OPACITY, 1f));
		}
		if (d.containsKey(TiC.PROPERTY_TITLE_PADDING_LEFT)) {
			titlePadding.left = TiConvert.toInt(d, TiC.PROPERTY_TITLE_PADDING_LEFT);
			btn.setPadding(titlePadding.left, titlePadding.top, titlePadding.right, titlePadding.bottom);
		}
		if (d.containsKey(TiC.PROPERTY_TITLE_PADDING_RIGHT)) {
			titlePadding.right = TiConvert.toInt(d, TiC.PROPERTY_TITLE_PADDING_RIGHT);
			btn.setPadding(titlePadding.left, titlePadding.top, titlePadding.right, titlePadding.bottom);
		}
		if (d.containsKey(TiC.PROPERTY_TITLE_PADDING_TOP)) {
			titlePadding.top = TiConvert.toInt(d, TiC.PROPERTY_TITLE_PADDING_TOP);
			btn.setPadding(titlePadding.left, titlePadding.top, titlePadding.right, titlePadding.bottom);
		}
		if (d.containsKey(TiC.PROPERTY_TITLE_PADDING_BOTTOM)) {
			titlePadding.bottom = TiConvert.toInt(d, TiC.PROPERTY_TITLE_PADDING_BOTTOM);
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
		if (d.containsKey(TiC.PROPERTY_WORD_WRAP)) {
			btn.setSingleLine(!TiConvert.toBoolean(d, TiC.PROPERTY_WORD_WRAP));
		}
		btn.invalidate();
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		Log.d(TAG, "Property: " + key + " old: " + oldValue + " new: " + newValue, Log.DEBUG_MODE);
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
			btn.requestLayout();
		} else if (key.equals(TiC.PROPERTY_WORD_WRAP)) {
			btn.setSingleLine(!TiConvert.toBoolean(newValue));
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	public void setOpacityForButton(float opacity)
	{
		if (opacity < 0 || opacity > 1) {
			Log.w(TAG, "Ignoring invalid value for opacity: " + opacity);
			return;
		}
		View view = getNativeView();
		if (view != null) {
			TiUIHelper.setPaintOpacity(((Button) view).getPaint(), opacity);
			Drawable[] drawables = ((Button) view).getCompoundDrawables();
			if (drawables != null) {
				for (int i = 0; i < drawables.length; i++) {
					TiUIHelper.setDrawableOpacity(drawables[i], opacity);
				}
			}
		}
	}

	public void clearOpacityForButton()
	{
		View view = getNativeView();
		if (view != null) {
			((Button) view).getPaint().setColorFilter(null);
			Drawable[] drawables = ((Button) view).getCompoundDrawables();
			if (drawables != null) {
				for (int i = 0; i < drawables.length; i++) {
					Drawable d = drawables[i];
					if (d != null) {
						d.clearColorFilter();
					}
				}
			}
		}
	}

	@Override
	public void setOpacity(float opacity)
	{
		setOpacityForButton(opacity);
		super.setOpacity(opacity);
	}

	@Override
	public void clearOpacity(View view)
	{
		super.clearOpacity(view);
		clearOpacityForButton();
	}
}
