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
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;

import android.view.Gravity;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

public class TiUIActivityIndicator extends TiUIView
{
	private static final String TAG = "TiUIActivityIndicator";

	protected int currentStyle;
	protected boolean visible;
	private TextView label;
	private ProgressBar progress;
	private LinearLayout view;

	public static final int PLAIN = android.R.attr.progressBarStyleSmall;
	public static final int BIG = android.R.attr.progressBarStyleLarge;
	public static final int DARK = android.R.attr.progressBarStyleSmallInverse;
	public static final int BIG_DARK = android.R.attr.progressBarStyleLargeInverse;

	public TiUIActivityIndicator(TiViewProxy proxy)
	{
		super(proxy);
		Log.d(TAG, "Creating an activity indicator", Log.DEBUG_MODE);

		view = new LinearLayout(proxy.getActivity());
		view.setOrientation(LinearLayout.HORIZONTAL);
		view.setGravity(Gravity.CENTER);

		label = new TextView(proxy.getActivity());
		label.setGravity(Gravity.CENTER_VERTICAL | Gravity.LEFT);
		label.setPadding(0, 0, 0, 0);
		label.setSingleLine(false);

		currentStyle = getStyle();
		progress = new ProgressBar(proxy.getActivity(), null, currentStyle);

		view.addView(progress);
		view.addView(label);
		view.setVisibility(View.INVISIBLE);
		visible = false;

		setNativeView(view);
	}

	@Override
	public void processProperties(KrollDict d)
	{
		super.processProperties(d);

		if (d.containsKey(TiC.PROPERTY_STYLE)) {
			setStyle(TiConvert.toInt(d, TiC.PROPERTY_STYLE));
		}
		if (d.containsKey(TiC.PROPERTY_FONT)) {
			TiUIHelper.styleText(label, d.getKrollDict(TiC.PROPERTY_FONT));
		}
		if (d.containsKey(TiC.PROPERTY_MESSAGE)) {
			label.setText(TiConvert.toString(d, TiC.PROPERTY_MESSAGE));
		}
		if (d.containsKey(TiC.PROPERTY_COLOR)) {
			label.setTextColor(TiConvert.toColor(d, TiC.PROPERTY_COLOR));
		}

		view.invalidate();
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		Log.d(TAG, "Property: " + key + " old: " + oldValue + " new: " + newValue, Log.DEBUG_MODE);

		if (key.equals(TiC.PROPERTY_STYLE)) {
			setStyle(TiConvert.toInt(newValue));
		} else if (key.equals(TiC.PROPERTY_FONT) && newValue instanceof HashMap) {
			TiUIHelper.styleText(label, (HashMap) newValue);
			label.requestLayout();
		} else if (key.equals(TiC.PROPERTY_MESSAGE)) {
			label.setText(TiConvert.toString(newValue));
			label.requestLayout();
		} else if (key.equals(TiC.PROPERTY_COLOR)) {
			label.setTextColor(TiConvert.toColor((String) newValue));
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	@Override
	public void show()
	{
		if (visible) {
			return;
		}
		super.show();
		visible = true;
	}

	@Override
	public void hide()
	{
		if (!visible) {
			return;
		}
		super.hide();
		visible = false;
	}

	protected int getStyle()
	{
		if (proxy.hasProperty(TiC.PROPERTY_STYLE)) {
			int style = TiConvert.toInt(proxy.getProperty(TiC.PROPERTY_STYLE));
			if (style != PLAIN && style != BIG && style != DARK && style != BIG_DARK) {
				Log.w(TAG, "Invalid value \"" + style + "\" for style.");
				return PLAIN;
			}
			return style;
		}
		return PLAIN;
	}

	protected void setStyle(int style)
	{
		if (style == currentStyle) {
			return;
		}
		if (style != PLAIN && style != BIG && style != DARK && style != BIG_DARK) {
			Log.w(TAG, "Invalid value \"" + style + "\" for style.");
			return;
		}

		view.removeAllViews();
		progress = new ProgressBar(proxy.getActivity(), null, style);
		currentStyle = style;
		view.addView(progress);
		view.addView(label);
		view.requestLayout();
	}
}
