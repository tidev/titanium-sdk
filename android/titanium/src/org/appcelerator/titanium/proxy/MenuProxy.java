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
	
	private static final String PROPERTY_TITLE = "title";
	
	protected Menu menu;
	protected ArrayList<MenuItemProxy> menuItems;
	protected HashMap<MenuItem, MenuItemProxy> menuMap;

	public MenuProxy(TiContext tiContext, Menu menu) 
	{
		super(tiContext);
		this.menu = menu;
		menuItems = new ArrayList<MenuItemProxy>();
		menuMap = new HashMap<MenuItem,MenuItemProxy>();
	}

	@Kroll.method
	public MenuItemProxy add(KrollDict d) 
	{
		MenuItemProxy mip = null;
		
		if(d.containsKey("title")) {
			String title = TiConvert.toString(d, PROPERTY_TITLE);
			int itemId = Menu.NONE;
			int groupId = Menu.NONE;
			int order = Menu.NONE;
			
			if (d.containsKey("itemId")) {
				itemId = TiConvert.toInt(d, "itemId");
			}
			if (d.containsKey("groupId")) {
				groupId = TiConvert.toInt(d, "groupId");
			}
			if (d.containsKey("order")) {
				order = TiConvert.toInt(d, "order");
			}
			
			MenuItem item = menu.add(groupId, itemId, order, title);
			mip = new MenuItemProxy(getTiContext(), item);
			synchronized(menuMap) {
				menuMap.put(item, mip);
			}
		} else {
			Log.w(LCAT, "add options for menuitem require a title property.");
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
			mip = menuMap.get(item);
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
		return menuMap.get(item);
	}
	
	@Kroll.method
	public boolean hasVisibleItems() {
		return menu.hasVisibleItems();
	}
	
	@Kroll.method
	public void removeGroup(int groupId) {
		//TODO will get to get items in the group and remove them from our map
		menu.removeGroup(groupId);
	}
	
	@Kroll.method
	public void removeItem(int itemId) {
		//TODO remove item from list too
		menu.removeItem(itemId);
	}
	
	@Kroll.method
	public void setGroupCheckable(int groupId, boolean checkable, boolean exclusive) {
	}
	
	@Kroll.method
	public void setGroupEnabled(int groupId, boolean visible) {
	}

	@Kroll.method
	public void setGroupVisible(int group, boolean visible) {
		
	}
	
	@Kroll.method
	public int size() {
		return menu.size();
	}
	
	@Kroll.method @Kroll.getProperty
	public MenuItemProxy[] getItems() {
		return menuItems.toArray(new MenuItemProxy[menuItems.size()]);
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
	
	public ArrayList<MenuItemProxy> getMenuItems() {
		return menuItems;
	}
	
	public void release() {	
		if (menu != null) {
			menu.clear();
			menu.close();
			menu = null;
		}
		//TODO walk the items and release the natives
		menuItems.clear();
		menuMap.clear();
	}
}
