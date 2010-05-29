/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.platform;

import java.lang.ref.SoftReference;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiProxy;

import android.util.DisplayMetrics;
import android.view.Display;

public class DisplayCapsProxy extends TiProxy
{
	private final DisplayMetrics dm;
	private SoftReference<Display> softDisplay;

	public DisplayCapsProxy(TiContext tiContext)
	{
		super(tiContext);
		dm = new DisplayMetrics();
	}

	private Display getDisplay() {
		if (softDisplay == null || softDisplay.get() == null) {
			softDisplay = new SoftReference<Display>(getTiContext().getActivity().getWindowManager().getDefaultDisplay());
		}
		return softDisplay.get();
	}

	public int getPlatformWidth() {
		return getDisplay().getWidth();
	}

	public int getPlatformHeight() {
		return getDisplay().getHeight();
	}

	public float getDensity() {
		synchronized(dm) {
			getDisplay().getMetrics(dm);
			return dm.density;
		}
	}

	public float getDpi() {
		synchronized(dm) {
			getDisplay().getMetrics(dm);
			return dm.densityDpi;
		}
	}

	public float getXdpi() {
		synchronized(dm) {
			getDisplay().getMetrics(dm);
			return dm.xdpi;
		}
	}

	public float getYdpi() {
		synchronized(dm) {
			getDisplay().getMetrics(dm);
			return dm.ydpi;
		}
	}

	public float getLogicalDensityFactor() {
		synchronized(dm) {
			getDisplay().getMetrics(dm);
			return dm.density;
		}
	}
}
