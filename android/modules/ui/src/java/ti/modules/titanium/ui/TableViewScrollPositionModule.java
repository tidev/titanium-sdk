/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;

import ti.modules.titanium.ui.UIModule;

@Kroll.module(parentModule = UIModule.class)
public class TableViewScrollPositionModule extends KrollModule
{
	@Kroll.constant
	public static final int TOP = 1;
	@Kroll.constant
	public static final int BOTTOM = 2;
	@Kroll.constant
	public static final int MIDDLE = 3;
	@Kroll.constant
	public static final int NONE = 0;

	@Override
	public String getApiName()
	{
		return "Ti.UI.TableViewScrollPositionModule";
	}
}
