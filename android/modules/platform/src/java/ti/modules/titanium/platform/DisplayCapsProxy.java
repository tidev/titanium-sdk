/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
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
		if (TiApplication.getAppRootOrCurrentActivity() == null) {
			return null;
		}
		if (softDisplay == null || softDisplay.get() == null) {
			// we only need the window manager so it doesn't matter if the root or current activity is used
			// for accessing it
			softDisplay = new SoftReference<Display>(
				TiApplication.getAppRootOrCurrentActivity().getWindowManager().getDefaultDisplay());
		}
		return softDisplay.get();
	}

	@Kroll.getProperty
	public int getPlatformWidth()
	{
		synchronized (dm)
		{
			if (getDisplay() != null) {
				getDisplay().getMetrics(dm);
				return dm.widthPixels;
			} else {
				return 0;
			}
		}
	}

	@Kroll.getProperty
	public int getPlatformHeight()
	{
		synchronized (dm)
		{
			if (getDisplay() != null) {
				getDisplay().getMetrics(dm);
				return dm.heightPixels;
			} else {
				return 0;
			}
		}
	}

	@Kroll.getProperty
	public String getDensity()
	{
		synchronized (dm)
		{
			if (getDisplay() != null) {
				getDisplay().getMetrics(dm);
				int dpi = dm.densityDpi;
				if (dpi >= DisplayMetrics.DENSITY_560) {
					return "xxxhigh";
				} else if (dpi >= DisplayMetrics.DENSITY_400) {
					return "xxhigh";
				} else if (dpi >= DisplayMetrics.DENSITY_280) {
					return "xhigh";
				} else if (dpi >= DisplayMetrics.DENSITY_HIGH) {
					return "high";
				} else if (dpi >= DisplayMetrics.DENSITY_TV) {
					return "tvdpi";
				} else if (dpi >= DisplayMetrics.DENSITY_MEDIUM) {
					return "medium";
				}
				return "low";
			} else {
				return "low";
			}
		}
	}

	@Kroll.getProperty
	public float getDpi()
	{
		synchronized (dm)
		{
			if (getDisplay() != null) {
				getDisplay().getMetrics(dm);
				return dm.densityDpi;
			} else {
				return 0;
			}
		}
	}

	@Kroll.getProperty
	public float getXdpi()
	{
		synchronized (dm)
		{
			if (getDisplay() != null) {
				getDisplay().getMetrics(dm);
				return dm.xdpi;
			} else {
				return 0;
			}
		}
	}

	@Kroll.getProperty
	public float getYdpi()
	{
		synchronized (dm)
		{
			if (getDisplay() != null) {
				getDisplay().getMetrics(dm);
				return dm.ydpi;
			} else {
				return 0;
			}
		}
	}

	@Kroll.getProperty
	public float getLogicalDensityFactor()
	{
		synchronized (dm)
		{
			if (getDisplay() != null) {
				getDisplay().getMetrics(dm);
				return dm.density;
			} else {
				return 0;
			}
		}
	}

	@Override
	public String getApiName()
	{
		return "Ti.Platform.DisplayCaps";
	}
}
