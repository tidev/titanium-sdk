/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.proxy;

import java.util.HashMap;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.AsyncResult;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiMessenger;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;

import android.os.Message;
import android.view.Menu;
import android.view.MenuItem;

@Kroll.proxy
public class MenuProxy extends KrollProxy
{
	private static final String TAG = "MenuProxy";

	private static final int MSG_FIRST_ID = KrollProxy.MSG_LAST_ID + 1;
	private static final int MSG_ADD = MSG_FIRST_ID + 100;
	private static final int MSG_CLOSE = MSG_FIRST_ID + 101;
	private static final int MSG_CLEAR = MSG_FIRST_ID + 102;
	private static final int MSG_REMOVE_GROUP = MSG_FIRST_ID + 103;
	private static final int MSG_REMOVE_ITEM = MSG_FIRST_ID + 104;
	private static final int MSG_SET_GROUP_ENABLED = MSG_FIRST_ID + 105;
	private static final int MSG_SET_GROUP_VISIBLE = MSG_FIRST_ID + 106;
	protected static final int MSG_LAST_ID = MSG_FIRST_ID + 999;

	protected Menu menu;
	protected HashMap<MenuItem, MenuItemProxy> menuMap;

	public MenuProxy(Menu menu) 
	{
		this.menu = menu;
		menuMap = new HashMap<MenuItem,MenuItemProxy>();
	}

	@Override
	public boolean handleMessage(Message msg) 
	{
		AsyncResult result = null;
		result = (AsyncResult) msg.obj;

		switch(msg.what) {
			case MSG_ADD: {
				result.setResult(handleAdd((KrollDict) result.getArg()));
				return true;
			}
			case MSG_CLOSE: {
				handleClose();
				result.setResult(null);
				return true;
			}
			case MSG_CLEAR: {
				handleClear();
				result.setResult(null);
				return true;
			}
			case MSG_REMOVE_GROUP: {
				handleRemoveGroup((Integer) result.getArg());
				result.setResult(null);
				return true;
			}
			case MSG_REMOVE_ITEM: {
				handleRemoveItem((Integer) result.getArg());
				result.setResult(null);
				return true;
			}
			case MSG_SET_GROUP_ENABLED: {
				handleSetGroupEnabled((HashMap) result.getArg());
				result.setResult(null);
				return true;
			}
			case MSG_SET_GROUP_VISIBLE: {
				handleSetGroupVisible((HashMap) result.getArg());
				result.setResult(null);
				return true;
			}
			default : {
				return super.handleMessage(msg);
			}
		}
	}

	@Kroll.method
	public MenuItemProxy add(KrollDict d)
	{
		MenuItemProxy mip = null;

		if (TiApplication.isUIThread()) {
			mip = handleAdd(d);
			return mip;
		}
		
		if (!(d instanceof KrollDict) && (d instanceof HashMap)) {
			d = new KrollDict(d);
		}

		return (MenuItemProxy) TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_ADD), (KrollDict) d);
	}

	public MenuItemProxy handleAdd(KrollDict d) 
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
		mip = new MenuItemProxy(item);
		synchronized(menuMap) {
			menuMap.put(item, mip);
		}
		
		if (d.containsKey(TiC.PROPERTY_ACTION_VIEW)) {
			mip.setActionView(d.get(TiC.PROPERTY_ACTION_VIEW));
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
		return mip;
	}

	@Kroll.method
	public void clear()
	{
		if (TiApplication.isUIThread()) {
			handleClear();
			return;
		}

		TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_CLEAR));
	}

	public void handleClear() {
		if (menu != null) {
			menu.clear();
			synchronized(menuMap) {
				menuMap.clear();
			}
		}
	}

	@Kroll.method
	public void close()
	{
		if (TiApplication.isUIThread()) {
			handleClose();
			return;
		}

		TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_CLOSE));
	}

	public void handleClose() {
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
	public void removeGroup(int groupId)
	{
		if (TiApplication.isUIThread()) {
			handleRemoveGroup(groupId);
			return;
		}

		TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_REMOVE_GROUP), groupId);
	}

	public void handleRemoveGroup(int groupId) {
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
	public void removeItem(int itemId)
	{
		if (TiApplication.isUIThread()) {
			handleRemoveItem(itemId);
			return;
		}

		TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_REMOVE_ITEM), itemId);
	}

	public void handleRemoveItem(int itemId) {
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
	public void setGroupEnabled(int groupId, boolean enabled)
	{
		HashMap args = new HashMap();
		args.put("groupId", groupId);
		args.put("enabled", enabled);

		if (TiApplication.isUIThread()) {
			handleSetGroupEnabled(args);
			return;
		}

		TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_SET_GROUP_ENABLED), args);
	}

	public void handleSetGroupEnabled(HashMap args) {
		menu.setGroupEnabled(((Integer)args.get("groupId")).intValue(), ((Boolean)args.get("enabled")).booleanValue());
	}

	@Kroll.method
	public void setGroupVisible(int groupId, boolean visible)
	{
		HashMap args = new HashMap();
		args.put("groupId", groupId);
		args.put("visible", visible);

		if (TiApplication.isUIThread()) {
			handleSetGroupVisible(args);
			return;
		}

		TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_SET_GROUP_VISIBLE), args);
	}

	public void handleSetGroupVisible(HashMap args) {
		menu.setGroupVisible(((Integer)args.get("groupId")).intValue(), ((Boolean)args.get("visible")).booleanValue());
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
			Log.w(TAG, "A new menu has been set, cleaning up old menu first", Log.DEBUG_MODE);
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
