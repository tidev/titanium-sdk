/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.platform;

import java.lang.ref.SoftReference;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiApplication;

import android.util.DisplayMetrics;
import android.view.Display;

@Kroll.proxy(parentModule = PlatformModule.class)
public class DisplayCapsProxy extends KrollProxy
{
	private DisplayMetrics dm;
	private SoftReference<Display> softDisplay;

	public DisplayCapsProxy()
	{
		super();
		dm = new DisplayMetrics();
	}

	private Display getDisplay()
	{
		if (softDisplay == null || softDisplay.get() == null) {
			// we only need the window manager so it doesn't matter if the root or current activity is used
			// for accessing it
			softDisplay = new SoftReference<Display>(
				TiApplication.getAppRootOrCurrentActivity().getWindowManager().getDefaultDisplay());
		}
		return softDisplay.get();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public int getPlatformWidth()
	// clang-format on
	{
		synchronized (dm)
		{
			getDisplay().getMetrics(dm);
			return dm.widthPixels;
		}
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public int getPlatformHeight()
	// clang-format on
	{
		synchronized (dm)
		{
			getDisplay().getMetrics(dm);
			return dm.heightPixels;
		}
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getDensity()
	// clang-format on
	{
		synchronized (dm)
		{
			getDisplay().getMetrics(dm);
			int dpi = dm.densityDpi;
			if (dpi >= 560) { // DisplayMetrics.DENSITY_560
				return "xxxhigh";
			} else if (dpi >= 400) { // DisplayMetrics.DENSITY_400
				return "xxhigh";
			} else if (dpi >= 280) { // DisplayMetrics.DENSITY_280
				return "xhigh";
			} else if (dpi >= DisplayMetrics.DENSITY_HIGH) {
				return "high";
			} else if (dpi >= DisplayMetrics.DENSITY_TV) {
				return "tvdpi";
			} else if (dpi >= DisplayMetrics.DENSITY_MEDIUM) {
				return "medium";
			}
			return "low";
		}
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public float getDpi()
	// clang-format on
	{
		synchronized (dm)
		{
			getDisplay().getMetrics(dm);
			return dm.densityDpi;
		}
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public float getXdpi()
	// clang-format on
	{
		synchronized (dm)
		{
			getDisplay().getMetrics(dm);
			return dm.xdpi;
		}
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public float getYdpi()
	// clang-format on
	{
		synchronized (dm)
		{
			getDisplay().getMetrics(dm);
			return dm.ydpi;
		}
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public float getLogicalDensityFactor()
	// clang-format on
	{
		synchronized (dm)
		{
			getDisplay().getMetrics(dm);
			return dm.density;
		}
	}

	@Override
	public String getApiName()
	{
		return "Ti.Platform.DisplayCaps";
	}
}
