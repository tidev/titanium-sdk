/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.proxy;

import java.util.ArrayList;
import java.util.HashMap;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;

import android.view.Menu;
import android.view.MenuItem;

@Kroll.proxy
public class MenuProxy extends KrollProxy
{
	private static final String LCAT = "MenuProxy";
	private final boolean DBG = TiConfig.LOGD;

	protected Menu menu;
	protected HashMap<MenuItem, MenuItemProxy> menuMap;

	public MenuProxy(TiContext tiContext, Menu menu) 
	{
		super(tiContext);
		this.menu = menu;
		menuMap = new HashMap<MenuItem,MenuItemProxy>();
	}

	@Kroll.method
	public MenuItemProxy add(KrollDict d) 
	{
		MenuItemProxy mip = null;
		
		String title = "";
		int itemId = Menu.NONE;
		int groupId = Menu.NONE;
		int order = Menu.NONE;
		
		if(d.containsKey(TiC.PROPERTY_TITLE)) {
			title = TiConvert.toString(d, TiC.PROPERTY_TITLE);
		}
		if (d.containsKey(TiC.PROPERTY_ITEM_ID)) {
			itemId = TiConvert.toInt(d, TiC.PROPERTY_ITEM_ID);
		}
		if (d.containsKey(TiC.PROPERTY_GROUP_ID)) {
			groupId = TiConvert.toInt(d, TiC.PROPERTY_GROUP_ID);
		}
		if (d.containsKey(TiC.PROPERTY_ORDER)) {
			order = TiConvert.toInt(d, TiC.PROPERTY_ORDER);
		}
		
		MenuItem item = menu.add(groupId, itemId, order, title);
		mip = new MenuItemProxy(getTiContext(), item);
		synchronized(menuMap) {
			menuMap.put(item, mip);
		}
		
		return mip;
	}

	@Kroll.method
	public void clear() {
		if (menu != null) {
			menu.clear();
			synchronized(menuMap) {
				menuMap.clear();
			}
		}
	}
	
	@Kroll.method
	public void close() {
		if (menu != null) {
			menu.close();
		}
	}
	
	@Kroll.method
	public MenuItemProxy findItem(int itemId) 
	{
		MenuItemProxy mip = null;
		MenuItem item = menu.findItem(itemId);
		if (item != null) {
			synchronized(menuMap) {
				mip = menuMap.get(item);
			}
		}
		
		return mip;
	}

	@Kroll.method
	public MenuItemProxy getItem(int index) 
	{
		MenuItemProxy mip = null;
		MenuItem item = menu.getItem(index);
		
		if (item != null) {
			mip = menuMap.get(item);
		}
				
		return mip;
	}
	
	public MenuItemProxy findItem(MenuItem item) {
		synchronized(menuMap) {
			return menuMap.get(item);
		}
	}
	
	@Kroll.method
	public boolean hasVisibleItems() {
		return menu.hasVisibleItems();
	}
	
	@Kroll.method
	public void removeGroup(int groupId) {
		//TODO will get to get items in the group and remove them from our map
		synchronized(menuMap) {
			menu.removeGroup(groupId);
			HashMap<MenuItem,MenuItemProxy> mm = new HashMap<MenuItem,MenuItemProxy>(menu.size());
			int len = menu.size();
			for (int i = 0; i < len; i++) {
				MenuItem mi = menu.getItem(i);
				MenuItemProxy mip = menuMap.get(mi);
				mm.put(mi, mip);
			}
			menuMap.clear();
			menuMap = mm;
		}
	}
	
	@Kroll.method
	public void removeItem(int itemId) {
		//TODO remove item from list too
		synchronized(menuMap) {
			MenuItem mi = menu.findItem(itemId);
			if (mi != null) {
				MenuItemProxy mip = menuMap.remove(mi);
				if (mip != null) {
					//TODO release mip items
				}
				menu.removeItem(itemId);
			}
		}
	}
	
	@Kroll.method
	public void setGroupCheckable(int groupId, boolean checkable, boolean exclusive) {
	}
	
	@Kroll.method
	public void setGroupEnabled(int groupId, boolean enabled) {
		menu.setGroupEnabled(groupId, enabled);
	}

	@Kroll.method
	public void setGroupVisible(int groupId, boolean visible) {
		menu.setGroupVisible(groupId, visible);
	}
	
	@Kroll.method
	public int size() {
		return menu.size();
	}
	
	@Kroll.method @Kroll.getProperty
	public MenuItemProxy[] getItems() {
		int len = menu.size();
		MenuItemProxy[] proxies = new MenuItemProxy[len];
		synchronized(menuMap) {
			for (int i = 0; i < len; i++) {
				MenuItem mi = menu.getItem(i);
				MenuItemProxy mip = menuMap.get(mi);
				proxies[i] = mip;
			}
		}
		return proxies;
	}
	
	public Menu getMenu() {
		return menu;
	}
	
	public void setMenu(Menu menu) {
		if (this.menu != null && this.menu != menu) {
			if (DBG) {
				Log.w(LCAT, "A new menu has been set, cleaning up old menu first");
			}
			release();
		}
		this.menu = menu;
	}
	
//	public ArrayList<MenuItemProxy> getMenuItems() {
//		return menuItems;
//	}
	
	public void release() {	
		if (menu != null) {
			menu.clear();
			menu.close();
			menu = null;
		}
		//TODO walk the items and release the natives
		menuMap.clear();
	}
}
