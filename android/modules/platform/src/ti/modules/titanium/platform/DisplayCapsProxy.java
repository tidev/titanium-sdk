/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.platform;

import java.lang.ref.SoftReference;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;

import android.util.DisplayMetrics;
import android.view.Display;

@Kroll.proxy
public class DisplayCapsProxy extends KrollProxy
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

	@Kroll.getProperty @Kroll.method
	public int getPlatformWidth() {
		return getDisplay().getWidth();
	}

	@Kroll.getProperty @Kroll.method
	public int getPlatformHeight() {
		return getDisplay().getHeight();
	}

	@Kroll.getProperty @Kroll.method
	public float getDensity() {
		synchronized(dm) {
			getDisplay().getMetrics(dm);
			return dm.density;
		}
	}

	@Kroll.getProperty @Kroll.method
	public float getDpi() {
		synchronized(dm) {
			getDisplay().getMetrics(dm);
			return dm.densityDpi;
		}
	}

	@Kroll.getProperty @Kroll.method
	public float getXdpi() {
		synchronized(dm) {
			getDisplay().getMetrics(dm);
			return dm.xdpi;
		}
	}

	@Kroll.getProperty @Kroll.method
	public float getYdpi() {
		synchronized(dm) {
			getDisplay().getMetrics(dm);
			return dm.ydpi;
		}
	}

	@Kroll.getProperty @Kroll.method
	public float getLogicalDensityFactor() {
		synchronized(dm) {
			getDisplay().getMetrics(dm);
			return dm.density;
		}
	}
}
