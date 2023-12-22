/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.activityindicatorstyle;

import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;

import ti.modules.titanium.ui.UIModule;
import ti.modules.titanium.ui.widget.TiUIActivityIndicator;

@Kroll.module(parentModule = UIModule.class)
public class ActivityIndicatorStyleModule extends KrollModule
{
	@Kroll.constant
	public static final int PLAIN = TiUIActivityIndicator.PLAIN;
	@Kroll.constant
	public static final int BIG = TiUIActivityIndicator.BIG;
	@Kroll.constant
	public static final int DARK = TiUIActivityIndicator.DARK;
	@Kroll.constant
	public static final int BIG_DARK = TiUIActivityIndicator.BIG_DARK;

	public ActivityIndicatorStyleModule()
	{
		super();
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.ActivityIndicatorStyle";
	}
}
