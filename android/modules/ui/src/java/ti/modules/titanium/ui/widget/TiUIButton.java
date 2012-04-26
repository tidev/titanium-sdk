/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
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
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.io.TiBaseFile;
import org.appcelerator.titanium.io.TiFileFactory;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;

import android.graphics.Bitmap;
import android.graphics.drawable.BitmapDrawable;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;

public class TiUIButton extends TiUIView
{
	private static final String LCAT = "TiUIButton";
	private static final boolean DBG = TiConfig.LOGD;

	public TiUIButton(final TiViewProxy proxy) {
		super(proxy);
		if (DBG) {
			Log.d(LCAT, "Creating a button");
		}
		Button btn = new Button(proxy.getActivity());
		btn.setPadding(8, 2, 8, 8);
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
			BitmapDrawable image;
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
				image = new BitmapDrawable(btn.getResources(), bitmap);

				TiDimension optionH = layoutParams.optionHeight;
				TiDimension optionW = layoutParams.optionWidth;
				int buttonHeight;
				int buttonWidth;
				int paddingTop = btn.getPaddingTop();
				int paddingBottom = btn.getPaddingBottom();
				int paddingLeft = btn.getPaddingLeft();
				int paddingRight = btn.getPaddingRight();
				int imgIntrisicHeight = image.getIntrinsicHeight();
				int imgIntrisicWidth = image.getIntrinsicWidth();

				if (optionH == null && optionW != null) {
					buttonWidth = optionW.getIntValue() - paddingLeft - paddingRight;
					if (imgIntrisicWidth > buttonWidth) {
						bitmap = Bitmap.createScaledBitmap(bitmap, buttonWidth, imgIntrisicHeight * buttonWidth
							/ imgIntrisicWidth, true);
						image = new BitmapDrawable(btn.getResources(), bitmap);
					}
				} else if (optionH != null && optionW == null) {
					buttonHeight = optionH.getIntValue() - paddingTop - paddingBottom;
					if (imgIntrisicHeight > buttonHeight) {
						bitmap = Bitmap.createScaledBitmap(bitmap, imgIntrisicWidth * buttonHeight / imgIntrisicHeight,
							buttonHeight, true);
						image = new BitmapDrawable(btn.getResources(), bitmap);
					}
				} else if (optionH != null && optionW != null) {
					buttonHeight = optionH.getIntValue() - paddingTop - paddingBottom;
					buttonWidth = optionW.getIntValue() - paddingLeft - paddingRight;
					if (imgIntrisicWidth > buttonWidth || imgIntrisicHeight > buttonHeight) {
						bitmap = Bitmap.createScaledBitmap(
							bitmap,
							Math.min(Math.min(imgIntrisicWidth, buttonWidth), imgIntrisicWidth * buttonHeight
								/ imgIntrisicHeight),
							Math.min(Math.min(imgIntrisicHeight, buttonHeight), imgIntrisicHeight * buttonWidth
								/ imgIntrisicWidth), true);
						image = new BitmapDrawable(btn.getResources(), bitmap);
					}
				}

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
