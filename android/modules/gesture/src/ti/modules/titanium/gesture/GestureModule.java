/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.gesture;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.ContextSpecific;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiContext.OnConfigurationChanged;

import ti.modules.titanium.ui.UIModule;
import android.content.res.Configuration;

@ContextSpecific
public class GestureModule extends TiModule
	implements OnConfigurationChanged
{
	public static final String EVENT_ONCONFIGCHANGE = "orientationchange";

	protected boolean listeningForOrientation;

	public GestureModule(TiContext tiContext)
	{
		super(tiContext);
		listeningForOrientation = false;
		tiContext.addOnEventChangeListener(this);
	}

	@Override
	public void listenerAdded(String type, int count, KrollProxy proxy)
	{
		super.listenerAdded(type, count, proxy);

		if (type != null && EVENT_ONCONFIGCHANGE.equals(type)) {
			if (!listeningForOrientation) {
				getTiContext().setOnConfigurationChangedListener(this);
				listeningForOrientation = true;
			}
		}
	}

	@Override
	public void listenerRemoved(String type, int count, KrollProxy proxy)
	{
		super.listenerRemoved(type, count, proxy);
		if (type != null && EVENT_ONCONFIGCHANGE.equals(this)) {
			if (count == 0) {
				getTiContext().setOnConfigurationChangedListener(null);
				listeningForOrientation = false;
			}
		}
	}

	@Override
	public void configurationChanged(Configuration newConfig)
	{
		KrollDict data = new KrollDict();
		data.put("orientation", convertToTiOrientation(newConfig.orientation));
		fireEvent(EVENT_ONCONFIGCHANGE, data);
	}

	private Configuration getConfiguration() {
		return getTiContext().getActivity().getResources().getConfiguration();
	}

	public boolean isPortrait() {
		return getConfiguration().orientation == Configuration.ORIENTATION_PORTRAIT;
	}

	public boolean isLandscape() {
		return getConfiguration().orientation == Configuration.ORIENTATION_LANDSCAPE;
	}

	public int getOrientation() {
		return convertToTiOrientation(getConfiguration().orientation);
	}

	private int convertToTiOrientation(int orientation) {
		int result = UIModule.UNKNOWN;

		switch(orientation)
		{
			case Configuration.ORIENTATION_LANDSCAPE :
				result = UIModule.LANDSCAPE_LEFT;
				break;
			case Configuration.ORIENTATION_PORTRAIT :
				result = UIModule.PORTRAIT;
				break;
		}

		return result;
	}

	@Override
	public void onResume()
	{
		super.onResume();

		if (listeningForOrientation) {
			getTiContext().setOnConfigurationChangedListener(this);
		}
	}

	@Override
	public void onPause()
	{
		super.onPause();

		if (listeningForOrientation) {
			getTiContext().setOnConfigurationChangedListener(null);
		}
	}
}
