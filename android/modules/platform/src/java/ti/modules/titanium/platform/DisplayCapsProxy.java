/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.platform;

import java.lang.ref.SoftReference;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDimension;

import android.util.DisplayMetrics;
import android.view.Display;
import android.view.View;

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

	public DisplayCapsProxy(TiContext tiContext)
	{
		this();
	}

	private Display getDisplay() {
		if (softDisplay == null || softDisplay.get() == null) {
			// we only need the window manager so it doesn't matter if the root or current activity is used
			// for accessing it
			softDisplay = new SoftReference<Display>(TiApplication.getAppRootOrCurrentActivity().getWindowManager().getDefaultDisplay());
		}
		return softDisplay.get();
	}

	@Kroll.getProperty @Kroll.method
	public int getPlatformWidth() {
		synchronized (dm) {
			getDisplay().getMetrics(dm);
			return getAsDefault(dm.widthPixels, dm, TiDimension.TYPE_WIDTH);
		}
	}

	@Kroll.getProperty @Kroll.method
	public int getPlatformHeight() {
		synchronized (dm) {
			getDisplay().getMetrics(dm);
			return getAsDefault(dm.heightPixels, dm, TiDimension.TYPE_HEIGHT);
		}
	}
	
	private int getAsDefault(int val, DisplayMetrics dm, int valueType) {
		String defaultUnit = TiApplication.getInstance().getDefaultUnit();
		if (TiDimension.UNIT_DP.equals(defaultUnit) || TiDimension.UNIT_DIP.equals(defaultUnit)) {
			return (int) Math.round((val / dm.density));
		} else if (TiDimension.UNIT_MM.equals(defaultUnit)) {
			return (int) (val / getDPIForType(dm, valueType) * TiDimension.MM_INCH);
		} else if (TiDimension.UNIT_CM.equals(defaultUnit)) {
			return (int) ((val / getDPIForType(dm, valueType)) * TiDimension.CM_INCH);
		} else if (TiDimension.UNIT_IN.equals(defaultUnit)) {
			return (int) (val / getDPIForType(dm, valueType));
		}

		// Returned for PX, SYSTEM, and unknown values
		return val;
	}
	
	private double getDPIForType(DisplayMetrics dm, int valueType) {
		float dpi = -1;
		switch (valueType) {
			case TiDimension.TYPE_HEIGHT:
				dpi = dm.ydpi;
				break;
			case TiDimension.TYPE_WIDTH:
				dpi = dm.xdpi;
				break;
			default:
				dpi = dm.densityDpi;
		}

		return dpi;
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
			case 480 :
				return "xxhigh";
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

	@Override
	public String getApiName()
	{
		return "Ti.Platform.DisplayCaps";
	}
}
