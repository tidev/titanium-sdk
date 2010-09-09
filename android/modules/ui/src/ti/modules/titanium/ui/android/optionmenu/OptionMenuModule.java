/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.android.optionmenu;

import java.util.ArrayList;
import java.util.HashMap;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiFileHelper;

import ti.modules.titanium.ui.android.AndroidModule;
import android.graphics.drawable.Drawable;
import android.view.Menu;
import android.view.MenuItem;

@Kroll.module(parentModule=AndroidModule.class)
public class OptionMenuModule extends KrollProxy {

	public OptionMenuModule(TiContext tiContext) {
		super(tiContext);
	}

	@Kroll.setProperty @Kroll.method
	public void setMenu(MenuProxy menu) {
		setMenuListener(menu);
	}
	
	private void setMenuListener(final MenuProxy menu)
	{
		menu.getTiContext().setOnMenuEventListener(new TiContext.OnMenuEvent()
		{

			private HashMap<Integer, MenuItemProxy> itemMap;

			private MenuProxy getMenuProxy() {
				return (MenuProxy) menu;
			}

			@Override
			public boolean hasMenu()
			{
				return getMenuProxy() != null;
			}

			@Override
			public boolean menuItemSelected(MenuItem item) {
				MenuItemProxy mip = itemMap.get(item.getItemId());
				if (mip != null) {
					mip.fireEvent("click", null);
					return true;
				}
				return false;
			}

			@Override
			public boolean prepareMenu(Menu menu)
			{
				menu.clear();
				MenuProxy mp = getMenuProxy();
				if (mp != null) {
					ArrayList<MenuItemProxy> menuItems = mp.getMenuItems();
					itemMap = new HashMap<Integer, MenuItemProxy>(menuItems.size());
					int id = 0;

					for (MenuItemProxy mip : menuItems) {
						String title = TiConvert.toString(mip.getProperty("title"));
						if (title != null) {
							MenuItem mi = menu.add(0, id, 0, title);
							itemMap.put(id, mip);
							id += 1;

							String iconPath = TiConvert.toString(mip.getProperty("icon"));
							if (iconPath != null) {
				     			Drawable d = null;
								TiFileHelper tfh = new TiFileHelper(getTiContext().getActivity());
								d = tfh.loadDrawable(iconPath, false);
								if (d != null) {
									mi.setIcon(d);
								}
							}
						}
					}
					return true;
				}
				return false;
			}
		});
	}
}
