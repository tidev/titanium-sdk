/**
 * TiDev Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import android.content.res.ColorStateList;

import com.google.android.material.floatingactionbutton.FloatingActionButton;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiDrawableReference;
import org.appcelerator.titanium.view.TiUIView;

public class TiUIFab extends TiUIView
{
	private static final String TAG = "TiUIFab";
	FloatingActionButton fab;

	public TiUIFab(TiViewProxy proxy)
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
			TiDrawableReference source = TiDrawableReference.fromObject(getProxy(), d.get(TiC.PROPERTY_IMAGE));
			fab.setImageDrawable(source.getDrawable());
		}
		if (d.containsKey(TiC.EVENT_PROPERTY_SIZE)) {
			if (d.getString(TiC.EVENT_PROPERTY_SIZE).equals("mini")) {
				fab.setSize(FloatingActionButton.SIZE_MINI);
			} else {
				fab.setSize(FloatingActionButton.SIZE_NORMAL);
			}
		}
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		if (key.equals(TiC.PROPERTY_BACKGROUND_COLOR)) {
			fab.setBackgroundTintList(ColorStateList.valueOf(TiConvert.toColor(newValue, proxy.getActivity())));
		} else if (key.equals(TiC.PROPERTY_IMAGE)) {
			TiDrawableReference source = TiDrawableReference.fromObject(getProxy(), newValue);
			fab.setImageDrawable(source.getDrawable());
		} else if (key.equals(TiC.EVENT_PROPERTY_SIZE)) {
			if (newValue.equals("mini")) {
				fab.setSize(FloatingActionButton.SIZE_MINI);
			} else {
				fab.setSize(FloatingActionButton.SIZE_NORMAL);
			}
		}
	}
}
