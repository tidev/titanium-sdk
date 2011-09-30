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

import android.util.DisplayMetrics;
import android.view.Display;

@Kroll.proxy(parentModule=PlatformModule.class)
public class DisplayCapsProxy extends KrollProxy
{
	private final DisplayMetrics dm;
	private SoftReference<Display> softDisplay;

	public DisplayCapsProxy()
	{
		super();
		dm = new DisplayMetrics();
	}

	private Display getDisplay() {
		if (softDisplay == null || softDisplay.get() == null) {
			softDisplay = new SoftReference<Display>(getActivity().getWindowManager().getDefaultDisplay());
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
	public String getDensity() {
		synchronized(dm) {
			getDisplay().getMetrics(dm);
			switch(dm.densityDpi) {
			case DisplayMetrics.DENSITY_HIGH :
				return "high";
			case DisplayMetrics.DENSITY_MEDIUM :
				return "medium";
			case 320 : // DisplayMetrics.DENSITY_XHIGH (API 9)
				return "xhigh";
			case DisplayMetrics.DENSITY_LOW :
				return "low";
			default :
				return "medium";
			}
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
