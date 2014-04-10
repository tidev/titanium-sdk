/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import java.util.HashMap;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;

import android.graphics.Color;
import android.text.Html;
import android.text.InputType;
import android.text.TextUtils.TruncateAt;
import android.text.util.Linkify;
import android.view.Gravity;
import android.widget.TextView;

public class TiUILabel extends TiUIView
{
	private static final String TAG = "TiUILabel";
	private static final float DEFAULT_SHADOW_RADIUS = 0.5f;

	private int defaultColor;
	private boolean wordWrap = true;
	private boolean ellipsize;
	private float shadowRadius = DEFAULT_SHADOW_RADIUS;
	private float shadowX = 0f;
	private float shadowY = 0f;
	private int shadowColor = Color.TRANSPARENT;

	public TiUILabel(final TiViewProxy proxy)
	{
		super(proxy);
		Log.d(TAG, "Creating a text label", Log.DEBUG_MODE);
		TextView tv = new TextView(getProxy().getActivity())
		{
			@Override
			protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec)
			{
				// Only allow label to exceed the size of parent when it's size behavior with both wordwrap and ellipsize disabled
				if (!wordWrap && !ellipsize && layoutParams.optionWidth == null && !layoutParams.autoFillsWidth) {
					widthMeasureSpec = MeasureSpec.makeMeasureSpec(MeasureSpec.getSize(widthMeasureSpec),
						MeasureSpec.UNSPECIFIED);
					heightMeasureSpec = MeasureSpec.makeMeasureSpec(MeasureSpec.getSize(heightMeasureSpec),
						MeasureSpec.UNSPECIFIED);
				}

				super.onMeasure(widthMeasureSpec, heightMeasureSpec);
			}

			@Override
			protected void onLayout(boolean changed, int left, int top, int right, int bottom)
			{
				super.onLayout(changed, left, top, right, bottom);

				if (proxy != null && proxy.hasListeners(TiC.EVENT_POST_LAYOUT)) {
					proxy.fireEvent(TiC.EVENT_POST_LAYOUT, null, false);
				}
			}
		};
		tv.setGravity(Gravity.CENTER_VERTICAL | Gravity.LEFT);
		tv.setPadding(0, 0, 0, 0);
		tv.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_MULTI_LINE);
		tv.setKeyListener(null);
		tv.setFocusable(false);
		tv.setSingleLine(false);
		TiUIHelper.styleText(tv, null);
		defaultColor =  tv.getCurrentTextColor();
		setNativeView(tv);

	}

	@Override
	public void processProperties(KrollDict d)
	{
		super.processProperties(d);

		TextView tv = (TextView) getNativeView();
		
		boolean needShadow = false;

		// Only accept one, prefer text to title.
		if (d.containsKey(TiC.PROPERTY_HTML)) {
			String html = TiConvert.toString(d, TiC.PROPERTY_HTML);
			if (html == null) {
				html = "";
			}
			tv.setText(Html.fromHtml(html), TextView.BufferType.SPANNABLE);
		} else if (d.containsKey(TiC.PROPERTY_TEXT)) {
			tv.setText(TiConvert.toString(d,TiC.PROPERTY_TEXT));
		} else if (d.containsKey(TiC.PROPERTY_TITLE)) { //TODO this may not need to be supported.
			tv.setText(TiConvert.toString(d,TiC.PROPERTY_TITLE));
		}

		if (d.containsKey(TiC.PROPERTY_INCLUDE_FONT_PADDING)) {
			tv.setIncludeFontPadding(TiConvert.toBoolean(d, TiC.PROPERTY_INCLUDE_FONT_PADDING, true));
		}

		if (d.containsKey(TiC.PROPERTY_COLOR)) {
			Object color = d.get(TiC.PROPERTY_COLOR);
			if (color == null) {
				tv.setTextColor(defaultColor);
			} else {
				tv.setTextColor(TiConvert.toColor(d, TiC.PROPERTY_COLOR));
			}
		}
		if (d.containsKey(TiC.PROPERTY_HIGHLIGHTED_COLOR)) {
			tv.setHighlightColor(TiConvert.toColor(d, TiC.PROPERTY_HIGHLIGHTED_COLOR));
		}
		if (d.containsKey(TiC.PROPERTY_FONT)) {
			TiUIHelper.styleText(tv, d.getKrollDict(TiC.PROPERTY_FONT));
		}
		if (d.containsKey(TiC.PROPERTY_TEXT_ALIGN) || d.containsKey(TiC.PROPERTY_VERTICAL_ALIGN)) {
			String textAlign = d.optString(TiC.PROPERTY_TEXT_ALIGN, "left");
			String verticalAlign = d.optString(TiC.PROPERTY_VERTICAL_ALIGN, "middle");
			TiUIHelper.setAlignment(tv, textAlign, verticalAlign);
		}
		if (d.containsKey(TiC.PROPERTY_ELLIPSIZE)) {
			ellipsize = TiConvert.toBoolean(d, TiC.PROPERTY_ELLIPSIZE, false);
			if (ellipsize) {
				tv.setEllipsize(TruncateAt.END);
			} else {
				tv.setEllipsize(null);
			}
		}
		if (d.containsKey(TiC.PROPERTY_WORD_WRAP)) {
			wordWrap = TiConvert.toBoolean(d, TiC.PROPERTY_WORD_WRAP, true);
			tv.setSingleLine(!wordWrap);
		}
		if (d.containsKey(TiC.PROPERTY_SHADOW_OFFSET)) {
			Object value = d.get(TiC.PROPERTY_SHADOW_OFFSET);
			if (value instanceof HashMap) {
				needShadow = true;
				HashMap dict = (HashMap) value;
				shadowX = TiConvert.toFloat(dict.get(TiC.PROPERTY_X), 0);
				shadowY = TiConvert.toFloat(dict.get(TiC.PROPERTY_Y), 0);
			}
		}
		if (d.containsKey(TiC.PROPERTY_SHADOW_RADIUS)) {
			needShadow = true;
			shadowRadius = TiConvert.toFloat(d.get(TiC.PROPERTY_SHADOW_RADIUS), DEFAULT_SHADOW_RADIUS);
		}
		if (d.containsKey(TiC.PROPERTY_SHADOW_COLOR)) {
			needShadow = true;
			shadowColor = TiConvert.toColor(d, TiC.PROPERTY_SHADOW_COLOR);
		}
		if (needShadow) {
			tv.setShadowLayer(shadowRadius, shadowX, shadowY, shadowColor);
		}
		// This needs to be the last operation.
		TiUIHelper.linkifyIfEnabled(tv, d.get(TiC.PROPERTY_AUTO_LINK));
		tv.invalidate();
	}
	
	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		TextView tv = (TextView) getNativeView();
		if (key.equals(TiC.PROPERTY_HTML)) {
			tv.setText(Html.fromHtml(TiConvert.toString(newValue)), TextView.BufferType.SPANNABLE);
			TiUIHelper.linkifyIfEnabled(tv, proxy.getProperty(TiC.PROPERTY_AUTO_LINK));
			tv.requestLayout();
		} else if (key.equals(TiC.PROPERTY_TEXT) || key.equals(TiC.PROPERTY_TITLE)) {
			tv.setText(TiConvert.toString(newValue));
			TiUIHelper.linkifyIfEnabled(tv, proxy.getProperty(TiC.PROPERTY_AUTO_LINK));
			tv.requestLayout();
		} else if (key.equals(TiC.PROPERTY_INCLUDE_FONT_PADDING)) {
			tv.setIncludeFontPadding(TiConvert.toBoolean(newValue, true));
		} else if (key.equals(TiC.PROPERTY_COLOR)) {
			if (newValue == null) {
				tv.setTextColor(defaultColor);
			} else {
				tv.setTextColor(TiConvert.toColor((String) newValue));
			}
		} else if (key.equals(TiC.PROPERTY_HIGHLIGHTED_COLOR)) {
			tv.setHighlightColor(TiConvert.toColor((String) newValue));
		} else if (key.equals(TiC.PROPERTY_TEXT_ALIGN)) {
			TiUIHelper.setAlignment(tv, TiConvert.toString(newValue), null);
			tv.requestLayout();
		} else if (key.equals(TiC.PROPERTY_VERTICAL_ALIGN)) {
			TiUIHelper.setAlignment(tv, null, TiConvert.toString(newValue));
			tv.requestLayout();
		} else if (key.equals(TiC.PROPERTY_FONT)) {
			TiUIHelper.styleText(tv, (HashMap) newValue);
			tv.requestLayout();
		} else if (key.equals(TiC.PROPERTY_ELLIPSIZE)) {
			ellipsize = TiConvert.toBoolean(newValue, false);
			if (ellipsize) {
				tv.setEllipsize(TruncateAt.END);
			} else {
				tv.setEllipsize(null);
			}
		} else if (key.equals(TiC.PROPERTY_WORD_WRAP)) {
			wordWrap = TiConvert.toBoolean(newValue, true);
			tv.setSingleLine(!wordWrap);
		} else if (key.equals(TiC.PROPERTY_AUTO_LINK)) {
			Linkify.addLinks(tv, TiConvert.toInt(newValue));
		} else if (key.equals(TiC.PROPERTY_SHADOW_OFFSET)) {
			if (newValue instanceof HashMap) {
				HashMap dict = (HashMap) newValue;
				shadowX = TiConvert.toFloat(dict.get(TiC.PROPERTY_X), 0);
				shadowY = TiConvert.toFloat(dict.get(TiC.PROPERTY_Y), 0);
				tv.setShadowLayer(shadowRadius, shadowX, shadowY, shadowColor);
			}
		} else if (key.equals(TiC.PROPERTY_SHADOW_RADIUS)) {
			shadowRadius = TiConvert.toFloat(newValue, DEFAULT_SHADOW_RADIUS);
			tv.setShadowLayer(shadowRadius, shadowX, shadowY, shadowColor);
		} else if (key.equals(TiC.PROPERTY_SHADOW_COLOR)) {
			shadowColor = TiConvert.toColor(TiConvert.toString(newValue));
			tv.setShadowLayer(shadowRadius, shadowX, shadowY, shadowColor);
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	public void setClickable(boolean clickable) {
		((TextView)getNativeView()).setClickable(clickable);
	}

}
