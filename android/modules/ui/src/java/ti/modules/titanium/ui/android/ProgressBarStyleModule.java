/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.android;

import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;

@Kroll.module(parentModule = AndroidModule.class)
public class ProgressBarStyleModule extends KrollModule
{
	@Kroll.constant
	public static final int DEFAULT = 0;
	@Kroll.constant
	public static final int WAVY = 1;

	public ProgressBarStyleModule()
	{
		super();
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.Android.ProgressBarStyle";
	}
}
