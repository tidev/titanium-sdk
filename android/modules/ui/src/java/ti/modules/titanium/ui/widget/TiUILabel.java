/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import java.util.HashMap;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiConfig;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;

import android.text.Html;
import android.text.InputType;
import android.text.TextUtils.TruncateAt;
import android.text.util.Linkify;
import android.view.Gravity;
import android.view.View;
import android.widget.TextView;

public class TiUILabel extends TiUIView
{
	private static final String LCAT = "TiUILabel";
	private static final boolean DBG = TiConfig.LOGD;

	public TiUILabel(TiViewProxy proxy) {
		super(proxy);
		if (DBG) {
			Log.d(LCAT, "Creating a text label");
		}
		TextView tv = new TextView(getProxy().getActivity());
		tv.setGravity(Gravity.CENTER_VERTICAL | Gravity.LEFT);
		tv.setPadding(0, 0, 0, 0);
		tv.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_MULTI_LINE);
		tv.setKeyListener(null);
		tv.setFocusable(false);
		setNativeView(tv);
	}

	@Override
	public void processProperties(KrollDict d)
	{
		super.processProperties(d);

		TextView tv = (TextView) getNativeView();
		// Only accept one, prefer text to title.
		if (d.containsKey(TiC.PROPERTY_HTML)) {
			tv.setText(Html.fromHtml(TiConvert.toString(d, TiC.PROPERTY_HTML)), TextView.BufferType.SPANNABLE);
		} else if (d.containsKey(TiC.PROPERTY_TEXT)) {
			tv.setText(TiConvert.toString(d,TiC.PROPERTY_TEXT));
		} else if (d.containsKey(TiC.PROPERTY_TITLE)) { //TODO this may not need to be supported.
			tv.setText(TiConvert.toString(d,TiC.PROPERTY_TITLE));
		}

		if (d.containsKey(TiC.PROPERTY_COLOR)) {
			tv.setTextColor(TiConvert.toColor(d, TiC.PROPERTY_COLOR));
		}
		if (d.containsKey(TiC.PROPERTY_HIGHLIGHTED_COLOR)) {
			tv.setHighlightColor(TiConvert.toColor(d, TiC.PROPERTY_HIGHLIGHTED_COLOR));
		}
		if (d.containsKey(TiC.PROPERTY_FONT)) {
			TiUIHelper.styleText(tv, d.getKrollDict(TiC.PROPERTY_FONT));
		}
		if (d.containsKey(TiC.PROPERTY_TEXT_ALIGN) || d.containsKey(TiC.PROPERTY_VERTICAL_ALIGN)) {
			String textAlign = d.optString(TiC.PROPERTY_TEXT_ALIGN, "left");
			String verticalAlign = d.optString(TiC.PROPERTY_VERTICAL_ALIGN, "center");
			TiUIHelper.setAlignment(tv, textAlign, verticalAlign);
		}
		if (d.containsKey(TiC.PROPERTY_ELLIPSIZE)) {
			if (TiConvert.toBoolean(d, TiC.PROPERTY_ELLIPSIZE)) {
				tv.setEllipsize(TruncateAt.END);
			} else {
				tv.setEllipsize(null);
			}
		}
		if (d.containsKey(TiC.PROPERTY_WORD_WRAP)) {
			tv.setSingleLine(!TiConvert.toBoolean(d, TiC.PROPERTY_WORD_WRAP));
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
		} else if (key.equals(TiC.PROPERTY_COLOR)) {
			tv.setTextColor(TiConvert.toColor((String) newValue));
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
			if (TiConvert.toBoolean(newValue)) {
				tv.setEllipsize(TruncateAt.END);
			} else {
				tv.setEllipsize(null);
			}
		} else if (key.equals(TiC.PROPERTY_WORD_WRAP)) {
			tv.setSingleLine(!TiConvert.toBoolean(newValue));
		} else if (key.equals(TiC.PROPERTY_AUTO_LINK)) {
			Linkify.addLinks(tv, TiConvert.toInt(newValue));
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	public void setClickable(boolean clickable) {
		((TextView)getNativeView()).setClickable(clickable);
	}

	@Override
	protected void setOpacity(View view, float opacity)
	{
		if (view != null && view instanceof TextView) {
			TiUIHelper.setPaintOpacity(((TextView) view).getPaint(), opacity);
		}
		super.setOpacity(view, opacity);
	}

	@Override
	public void clearOpacity(View view)
	{
		super.clearOpacity(view);
		if (view != null && view instanceof TextView) {
			((TextView) view).getPaint().setColorFilter(null);
		}
	}
	
}
