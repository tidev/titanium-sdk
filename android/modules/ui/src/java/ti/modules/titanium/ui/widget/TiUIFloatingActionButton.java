/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import android.content.res.ColorStateList;
import android.graphics.PorterDuff;

import com.google.android.material.floatingactionbutton.FloatingActionButton;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiDrawableReference;
import org.appcelerator.titanium.view.TiUIView;

public class TiUIFloatingActionButton extends TiUIView
{
	private static final String TAG = "TiUIFloatingActionButton";
	FloatingActionButton fab;

	public TiUIFloatingActionButton(TiViewProxy proxy)
	{
		super(proxy);
		fab = new FloatingActionButton(TiApplication.getAppCurrentActivity());
		setNativeView(fab);
	}

	@Override
	public void processProperties(KrollDict d)
	{
		super.processProperties(d);

		if (fab == null) {
			return;
		}

		if (d.containsKey(TiC.PROPERTY_BACKGROUND_COLOR)) {
			fab.setBackgroundTintList(ColorStateList.valueOf(
				TiConvert.toColor(d, TiC.PROPERTY_BACKGROUND_COLOR, proxy.getActivity())));
		}
		if (d.containsKey(TiC.PROPERTY_IMAGE)) {
			setImage(d.get(TiC.PROPERTY_IMAGE));
		}
		if (d.containsKey("customSize")) {
			setCustomSize(TiConvert.toInt(d.get("customSize")));
		}
		if (d.containsKey("maxImageSize")) {
			setMaxImageSize(TiConvert.toInt(d.get("maxImageSize")));
		}
		if (d.containsKey(TiC.PROPERTY_TINT_COLOR)) {
			setTintColor(d.getString("tintColor"));
		}
		if (d.containsKeyAndNotNull(TiC.PROPERTY_TOUCH_FEEDBACK_COLOR)) {
			ColorStateList colorStateList = null;
			colorStateList = ColorStateList.valueOf(
				TiConvert.toColor(d, TiC.PROPERTY_TOUCH_FEEDBACK_COLOR, proxy.getActivity()));
			fab.setRippleColor(colorStateList);
		}
		if (d.containsKey("iconSize")) {
			if (d.getString("iconSize").equals("mini")) {
				fab.setSize(FloatingActionButton.SIZE_MINI);
			} else {
				fab.setSize(FloatingActionButton.SIZE_NORMAL);
			}
		}
	}

	private void setMaxImageSize(int value)
	{
		TiDimension dim = TiConvert.toTiDimension(value, TiDimension.TYPE_WIDTH);
		fab.setMaxImageSize(dim.getAsPixels(fab));
	}

	private void setCustomSize(int value)
	{
		TiDimension dim = TiConvert.toTiDimension(value, TiDimension.TYPE_WIDTH);
		fab.setCustomSize(dim.getAsPixels(fab));
	}

	private void setImage(Object obj)
	{
		if (obj == null) {
			fab.setImageDrawable(null);
		} else {
			TiDrawableReference source = TiDrawableReference.fromObject(getProxy(), obj);
			fab.setImageDrawable(source.getDrawable());
		}
	}

	public void setTintColor(String color)
	{
		int tintColor = TiConvert.toColor(color, TiApplication.getAppCurrentActivity());
		fab.setColorFilter(tintColor, PorterDuff.Mode.SRC_IN);
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		if (key.equals(TiC.PROPERTY_BACKGROUND_COLOR)) {
			fab.setBackgroundTintList(ColorStateList.valueOf(TiConvert.toColor(newValue, proxy.getActivity())));
		} else if (key.equals(TiC.PROPERTY_IMAGE)) {
			setImage(newValue);
		} else if (key.equals("customSize")) {
			setCustomSize(TiConvert.toInt(newValue));
		} else if (key.equals("maxImageSize")) {
			setMaxImageSize(TiConvert.toInt(newValue));
		} else if (key.equals(TiC.PROPERTY_TOUCH_FEEDBACK_COLOR)) {
			ColorStateList colorStateList = null;
			colorStateList = ColorStateList.valueOf(TiConvert.toColor(newValue, proxy.getActivity()));
			fab.setRippleColor(colorStateList);
		} else if (key.equals(TiC.PROPERTY_TINT_COLOR)) {
			setTintColor(TiConvert.toString(newValue));
		}
	}
}
