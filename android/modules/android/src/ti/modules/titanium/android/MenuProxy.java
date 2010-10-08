/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.android;

import java.util.ArrayList;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;

@Kroll.proxy(creatableInModule=AndroidModule.class)
public class MenuProxy extends KrollProxy
{
	protected ArrayList<MenuItemProxy> menuItems;

	public MenuProxy(TiContext tiContext) {
		super(tiContext);
		menuItems = new ArrayList<MenuItemProxy>();
	}

	@Kroll.method
	public void add(MenuItemProxy mip) {
		menuItems.add(mip);
	}

	@Kroll.getProperty @Kroll.method
	protected ArrayList<MenuItemProxy> getMenuItems() {
		return menuItems;
	}
}
