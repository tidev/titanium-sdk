/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;

/**
 * This module exist so `Ti.UI.Shortcut.addEventListener()` is defined.
 * `Ti.UI.createShortcut` is manually defined in `UIModule`.
 */
@Kroll.module(parentModule = UIModule.class)
public class ShortcutModule extends KrollModule
{
	private static final String TAG = "ShortcutModule";

	public ShortcutModule()
	{
		super("Shortcut");
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.Shortcut";
	}
}
