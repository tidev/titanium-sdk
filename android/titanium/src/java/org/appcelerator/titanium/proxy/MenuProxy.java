/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.proxy;

import java.util.HashMap;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import androidx.appcompat.view.menu.MenuItemWrapperICS;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;

@Kroll.proxy
public class MenuProxy extends KrollProxy
{
	private static final String TAG = "MenuProxy";

	private static final int MSG_FIRST_ID = KrollProxy.MSG_LAST_ID + 1;
	protected static final int MSG_LAST_ID = MSG_FIRST_ID + 999;

	protected Menu menu;
	protected HashMap<MenuItem, MenuItemProxy> menuMap;

	public MenuProxy(Menu menu)
	{
		this.menu = menu;
		menuMap = new HashMap<MenuItem, MenuItemProxy>();
	}

	@Kroll.method
	public MenuItemProxy add(KrollDict d)
	{
		return handleAdd(d);
	}

	public MenuItemProxy handleAdd(KrollDict d)
	{
		MenuItemProxy mip = null;

		String title = "";
		int itemId = Menu.NONE;
		int groupId = Menu.NONE;
		int order = Menu.NONE;

		if (d.containsKey(TiC.PROPERTY_TITLE)) {
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
		mip = new MenuItemProxy(item);
		//Appcompat for ICS+ wraps the menu object so here we want to set the wrapped object for look-up purposes
		//since the wrapper will be copied when onOptionsItemSelected is invoked.
		if (item instanceof MenuItemWrapperICS) {
			MenuItemWrapperICS wrapper = (MenuItemWrapperICS) item;
			item = wrapper.getWrappedObject();
		}
		menuMap.put(item, mip);

		if (d.containsKey(TiC.PROPERTY_ACTION_VIEW)) {
			//check if view has a parent. If not, add it as action view. Otherwise, log error.
			Object viewProxy = d.get(TiC.PROPERTY_ACTION_VIEW);
			if (viewProxy instanceof TiViewProxy) {
				TiUIView view = ((TiViewProxy) viewProxy).getOrCreateView();
				if (view != null) {
					View nativeView = view.getNativeView();
					ViewGroup viewParent = (ViewGroup) nativeView.getParent();
					if (viewParent != null) {
						viewParent.removeView(nativeView);
					}
					mip.setActionView(viewProxy);
				}
			}
		}
		if (d.containsKey(TiC.PROPERTY_CHECKABLE)) {
			mip.setCheckable(TiConvert.toBoolean(d, TiC.PROPERTY_CHECKABLE));
		}
		if (d.containsKey(TiC.PROPERTY_CHECKED)) {
			mip.setChecked(TiConvert.toBoolean(d, TiC.PROPERTY_CHECKED));
		}
		if (d.containsKey(TiC.PROPERTY_ENABLED)) {
			mip.setEnabled(TiConvert.toBoolean(d, TiC.PROPERTY_ENABLED));
		}
		if (d.containsKey(TiC.PROPERTY_ICON)) {
			mip.setIcon(d.get(TiC.PROPERTY_ICON));
		}
		if (d.containsKey(TiC.PROPERTY_SHOW_AS_ACTION)) {
			mip.setShowAsAction(TiConvert.toInt(d, TiC.PROPERTY_SHOW_AS_ACTION));
		}
		if (d.containsKey(TiC.PROPERTY_TITLE_CONDENSED)) {
			mip.setTitleCondensed(TiConvert.toString(d, TiC.PROPERTY_TITLE_CONDENSED));
		}
		if (d.containsKey(TiC.PROPERTY_VISIBLE)) {
			mip.setVisible(TiConvert.toBoolean(d, TiC.PROPERTY_VISIBLE));
		}

		mip.setContentDescription(d);
		return mip;
	}

	@Kroll.method
	public void clear()
	{
		handleClear();
	}

	public void handleClear()
	{
		if (menu != null) {
			menu.clear();
			menuMap.clear();
		}
	}

	@Kroll.method
	public void close()
	{
		handleClose();
	}

	public void handleClose()
	{
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
			return findItem(item);
		}

		return mip;
	}

	@Kroll.method
	public MenuItemProxy getItem(int index)
	{
		MenuItemProxy mip = null;
		MenuItem item = menu.getItem(index);

		if (item != null) {
			mip = findItem(item);
		}

		return mip;
	}

	public MenuItemProxy findItem(MenuItem item)
	{
		//Appcompat for ICS+ wraps the menu object so here we want to get the wrapped object.
		if (item instanceof MenuItemWrapperICS) {
			MenuItemWrapperICS wrapper = (MenuItemWrapperICS) item;
			item = wrapper.getWrappedObject();
		}
		return menuMap.get(item);
	}

	@Kroll.method
	public boolean hasVisibleItems()
	{
		return menu.hasVisibleItems();
	}

	@Kroll.method
	public void removeGroup(int groupId)
	{
		handleRemoveGroup(groupId);
	}

	public void handleRemoveGroup(int groupId)
	{
		//TODO will get to get items in the group and remove them from our map
		menu.removeGroup(groupId);
		HashMap<MenuItem, MenuItemProxy> mm = new HashMap<MenuItem, MenuItemProxy>(menu.size());
		int len = menu.size();
		for (int i = 0; i < len; i++) {
			MenuItem mi = menu.getItem(i);
			//Appcompat for ICS+ wraps the menu object so here we want to get the wrapped object.
			if (mi instanceof MenuItemWrapperICS) {
				MenuItemWrapperICS wrapper = (MenuItemWrapperICS) mi;
				mi = wrapper.getWrappedObject();
			}
			MenuItemProxy mip = menuMap.get(mi);
			mm.put(mi, mip);
		}
		menuMap.clear();
		menuMap = mm;
	}

	@Kroll.method
	public void removeItem(int itemId)
	{
		handleRemoveItem(itemId);
	}

	public void handleRemoveItem(int itemId)
	{
		MenuItem mi = menu.findItem(itemId);
		if (mi != null) {
			//Appcompat for ICS+ wraps the menu object so here we want to get the wrapped object.
			if (mi instanceof MenuItemWrapperICS) {
				MenuItemWrapperICS wrapper = (MenuItemWrapperICS) mi;
				mi = wrapper.getWrappedObject();
			}
			MenuItemProxy mip = menuMap.remove(mi);
			if (mip != null) {
				//TODO release mip items
			}
			menu.removeItem(itemId);
		}
	}

	@Kroll.method
	public void setGroupCheckable(int groupId, boolean checkable, boolean exclusive)
	{
	}

	@Kroll.method
	public void setGroupEnabled(int groupId, boolean enabled)
	{
		HashMap args = new HashMap();
		args.put("groupId", groupId);
		args.put("enabled", enabled);
		handleSetGroupEnabled(args);
	}

	public void handleSetGroupEnabled(HashMap args)
	{
		menu.setGroupEnabled(((Integer) args.get("groupId")).intValue(),
							 ((Boolean) args.get("enabled")).booleanValue());
	}

	@Kroll.method
	public void setGroupVisible(int groupId, boolean visible)
	{
		HashMap args = new HashMap();
		args.put("groupId", groupId);
		args.put("visible", visible);
		handleSetGroupVisible(args);
	}

	public void handleSetGroupVisible(HashMap args)
	{
		menu.setGroupVisible(((Integer) args.get("groupId")).intValue(),
							 ((Boolean) args.get("visible")).booleanValue());
	}

	@Kroll.method
	public int size()
	{
		return menu.size();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public MenuItemProxy[] getItems()
	// clang-format on
	{
		int len = menu.size();
		MenuItemProxy[] proxies = new MenuItemProxy[len];
		for (int i = 0; i < len; i++) {
			MenuItem mi = menu.getItem(i);
			MenuItemProxy mip = findItem(mi);
			proxies[i] = mip;
		}

		return proxies;
	}

	public Menu getMenu()
	{
		return menu;
	}

	public void setMenu(Menu menu)
	{
		if (this.menu != null && this.menu != menu) {
			Log.w(TAG, "A new menu has been set, cleaning up old menu first", Log.DEBUG_MODE);
			release();
		}
		this.menu = menu;
	}

	//	public ArrayList<MenuItemProxy> getMenuItems() {
	//		return menuItems;
	//	}

	public void release()
	{
		if (menu != null) {
			menu.clear();
			menu.close();
			menu = null;
		}
		//TODO walk the items and release the natives
		menuMap.clear();
	}

	@Override
	public String getApiName()
	{
		return "Ti.Android.Menu";
	}
}
