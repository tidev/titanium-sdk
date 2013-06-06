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
import org.appcelerator.titanium.util.TiFileHelper;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.util.TiUrl;

import android.graphics.drawable.Drawable;
import android.os.Build;
import android.os.Message;
import android.view.MenuItem;
import android.view.MenuItem.OnActionExpandListener;
import android.view.View;

@Kroll.proxy
public class MenuItemProxy extends KrollProxy
{
	private static final String TAG = "MenuItem";

	private MenuItem item;


	private static final int MSG_FIRST_ID = KrollProxy.MSG_LAST_ID + 1;
	
	private static final int MSG_GROUP_ID = MSG_FIRST_ID + 200;
	private static final int MSG_ITEM_ID = MSG_FIRST_ID + 201;
	private static final int MSG_ORDER = MSG_FIRST_ID + 202;
	private static final int MSG_TITLE = MSG_FIRST_ID + 203;
	private static final int MSG_TITLE_CONDENSED = MSG_FIRST_ID + 204;
	private static final int MSG_SUB_MENU = MSG_FIRST_ID + 205;
	private static final int MSG_CHECKED = MSG_FIRST_ID + 206;
	private static final int MSG_CHECKABLE = MSG_FIRST_ID + 207;
	private static final int MSG_ENABLED = MSG_FIRST_ID + 208;
	private static final int MSG_VISIBLE = MSG_FIRST_ID + 209;
	private static final int MSG_SET_CHECKED = MSG_FIRST_ID + 210;
	private static final int MSG_SET_CHECKABLE = MSG_FIRST_ID + 211;
	private static final int MSG_SET_ENABLED = MSG_FIRST_ID + 212;
	private static final int MSG_SET_VISIBLE = MSG_FIRST_ID + 213;
	private static final int MSG_SET_ICON = MSG_FIRST_ID + 214;
	private static final int MSG_SET_TITLE = MSG_FIRST_ID + 215;
	private static final int MSG_SET_TITLE_CONDENSED = MSG_FIRST_ID + 216;
	private static final int MSG_ACTION_VIEW_EXPANDED = MSG_FIRST_ID + 217;

	protected static final int MSG_LAST_ID = MSG_FIRST_ID + 1000;

	private final class ActionExpandListener implements OnActionExpandListener {
		public boolean onMenuItemActionCollapse(MenuItem item) {
			fireEvent(TiC.EVENT_COLLAPSE, null);
			return true;
		}

		public boolean onMenuItemActionExpand(MenuItem item) {
			fireEvent(TiC.EVENT_EXPAND, null);
			return true;
		}
	}

	protected MenuItemProxy(MenuItem item)
	{
		this.item = item;

		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.ICE_CREAM_SANDWICH) {
			item.setOnActionExpandListener(new ActionExpandListener());
		}
	}

	@Override
	public boolean handleMessage(Message msg) 
	{
		AsyncResult result = null;
		result = (AsyncResult) msg.obj;

		switch(msg.what) {
			case MSG_GROUP_ID: {
				result.setResult(item.getGroupId());
				return true;
			}
			case MSG_ITEM_ID: {
				result.setResult(item.getItemId());
				return true;
			}
			case MSG_ORDER: {
				result.setResult(item.getOrder());
				return true;
			}
			case MSG_TITLE: {
				result.setResult(item.getTitle());
				return true;
			}
			case MSG_TITLE_CONDENSED: {
				result.setResult(item.getTitleCondensed());
				return true;
			}
			case MSG_SUB_MENU: {
				result.setResult(item.hasSubMenu());
				return true;
			}
			case MSG_CHECKED: {
				result.setResult(item.isChecked());
				return true;
			}
			case MSG_CHECKABLE: {
				result.setResult(item.isCheckable());
				return true;
			}
			case MSG_ENABLED: {
				result.setResult(item.isEnabled());
				return true;
			}
			case MSG_VISIBLE: {
				result.setResult(item.isVisible());
				return true;
			}
			case MSG_SET_CHECKED: {
				item.setChecked((Boolean)result.getArg());
				result.setResult(this);
				return true;
			}
			case MSG_SET_CHECKABLE: {
				item.setCheckable((Boolean)result.getArg());
				result.setResult(this);
				return true;
			}
			case MSG_SET_ENABLED: {
				item.setEnabled((Boolean)result.getArg());
				result.setResult(this);
				return true;
			}
			case MSG_SET_VISIBLE: {
				item.setVisible((Boolean)result.getArg());
				result.setResult(this);
				return true;
			}
			case MSG_SET_ICON: {
				result.setResult(handleSetIcon(result.getArg()));
				return true;
			}
			case MSG_SET_TITLE: {
				item.setTitle((String)result.getArg());
				result.setResult(this);
				return true;
			}
			case MSG_SET_TITLE_CONDENSED: {
				item.setTitleCondensed((String)result.getArg());
				result.setResult(this);
				return true;
			}
			case MSG_ACTION_VIEW_EXPANDED: {
				result.setResult(item.isActionViewExpanded());
				return true;
			}
			
			default : {
				return super.handleMessage(msg);
			}
		}
	}

	@Kroll.method @Kroll.getProperty
	public int getGroupId() {
		if (TiApplication.isUIThread()) {
			return item.getGroupId();
		}

		return (Integer) TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_GROUP_ID));
	}
	
	@Kroll.method @Kroll.getProperty
	public int getItemId() {
		if (TiApplication.isUIThread()) {
			return item.getItemId();
		}

		return (Integer) TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_ITEM_ID));
	}
	
	@Kroll.method @Kroll.getProperty
	public int getOrder() {
		if (TiApplication.isUIThread()) {
			return item.getOrder();
		}

		return (Integer) TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_ORDER));
	}
	
	@Kroll.method @Kroll.getProperty
	public String getTitle() {
		if (TiApplication.isUIThread()) {
			return (String) item.getTitle();
		}

		return (String) TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_TITLE));
	}
	
	@Kroll.method @Kroll.getProperty
	public String getTitleCondensed() {
		if (TiApplication.isUIThread()) {
			return (String) item.getTitleCondensed();
		}

		return (String) TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_TITLE_CONDENSED));
	}
	
	@Kroll.method
	public boolean hasSubMenu() {
		if (TiApplication.isUIThread()) {
			return item.hasSubMenu();
		}

		return (Boolean) TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_SUB_MENU));
	}
	
	@Kroll.method @Kroll.getProperty
	public boolean isChecked() {
		if (TiApplication.isUIThread()) {
			return item.isChecked();
		}

		return (Boolean) TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_CHECKED));
	}
	
	@Kroll.method @Kroll.getProperty
	public boolean isCheckable() {
		if (TiApplication.isUIThread()) {
			return item.isCheckable();
		}

		return (Boolean) TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_CHECKABLE));
	}
	
	@Kroll.method @Kroll.getProperty
	public boolean isEnabled() {
		if (TiApplication.isUIThread()) {
			return item.isEnabled();
		}

		return (Boolean) TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_ENABLED));
	}
	
	@Kroll.method @Kroll.getProperty
	public boolean isVisible() {
		if (TiApplication.isUIThread()) {
			return item.isVisible();
		}

		return (Boolean) TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_VISIBLE));
	}
	
	@Kroll.method @Kroll.setProperty
	public MenuItemProxy setCheckable(boolean checkable) {
		if (TiApplication.isUIThread()) {
			item.setCheckable(checkable);
			return this;
		}

		return (MenuItemProxy) TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_SET_CHECKABLE), checkable);
	}
	
	@Kroll.method @Kroll.setProperty
	public MenuItemProxy setChecked(boolean checked) {
		if (TiApplication.isUIThread()) {
			item.setChecked(checked);
			return this;
		}

		return (MenuItemProxy) TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_SET_CHECKED), checked);
	}
	
	@Kroll.method @Kroll.setProperty
	public MenuItemProxy setEnabled(boolean enabled) {
		if (TiApplication.isUIThread()) {
			item.setEnabled(enabled);
			return this;
		}

		return (MenuItemProxy) TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_SET_ENABLED), enabled);
	}
	
	private MenuItemProxy handleSetIcon(Object icon) 
	{
		if (icon != null) {
			if (icon instanceof String) {
				String iconPath = TiConvert.toString(icon);
				TiUrl iconUrl = new TiUrl(iconPath);
				if (iconPath != null) {
					TiFileHelper tfh = new TiFileHelper(TiApplication.getInstance());
					Drawable d = tfh.loadDrawable(iconUrl.resolve(), false);
					if (d != null) {
						item.setIcon(d);
					}
				}
			} else if (icon instanceof Number) {
				Drawable d = TiUIHelper.getResourceDrawable(TiConvert.toInt(icon));
				if (d != null) {
					item.setIcon(d);
				}
			}
		}
		return this;
	}
	@Kroll.method @Kroll.setProperty
	public MenuItemProxy setIcon(Object icon) 
	{
		if (TiApplication.isUIThread()) {
			return handleSetIcon(icon);
		}

		return (MenuItemProxy) TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_SET_ICON), icon);	
	}
	
	@Kroll.method @Kroll.setProperty
	public MenuItemProxy setTitle(String title) {
		if (TiApplication.isUIThread()) {
			item.setTitle(title);
			return this;
		}

		return (MenuItemProxy) TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_SET_TITLE), title);
	}
	
	@Kroll.method @Kroll.setProperty
	public MenuItemProxy setTitleCondensed(String title) {
		if (TiApplication.isUIThread()) {
			item.setTitleCondensed(title);
			return this;
		}

		return (MenuItemProxy) TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_SET_TITLE_CONDENSED), title);
	}
	
	@Kroll.method @Kroll.setProperty
	public MenuItemProxy setVisible(boolean visible) {
		if (TiApplication.isUIThread()) {
			item.setVisible(visible);
			return this;
		}

		return (MenuItemProxy) TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_SET_VISIBLE), visible);
	}

	@Kroll.method @Kroll.setProperty
	public void setActionView(Object view)
	{
		if (view instanceof TiViewProxy) {
			if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.HONEYCOMB) {
				final View v = ((TiViewProxy) view).getOrCreateView().getNativeView();
				TiMessenger.postOnMain(new Runnable() {
					public void run() {
						item.setActionView(v);
					}
				});

			} else {
				Log.i(TAG, "Action bar is not available on this device. Ignoring actionView property.", Log.DEBUG_MODE);
			}
		} else {
			Log.w(TAG, "Invalid type for actionView", Log.DEBUG_MODE);
		}
	}

	@Kroll.method @Kroll.setProperty
	public void setShowAsAction(final int flag) {
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.HONEYCOMB) {
			TiMessenger.postOnMain(new Runnable() {
				public void run() {
					item.setShowAsAction(flag);
				}
			});

		} else {
			Log.i(TAG, "Action bar unsupported by this device. Ignoring showAsAction property.", Log.DEBUG_MODE);
		}
	}

	@Kroll.method
	public void collapseActionView() {
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.ICE_CREAM_SANDWICH) {
			TiMessenger.postOnMain(new Runnable() {
				public void run() {
					item.collapseActionView();
				}
			});

		} else {
			Log.i(TAG, "This device does not support collapsing action views. No operation performed.", Log.DEBUG_MODE);
		}
	}

	@Kroll.method
	public void expandActionView() {
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.ICE_CREAM_SANDWICH) {
			TiMessenger.postOnMain(new Runnable() {
				public void run() {
					item.expandActionView();
				}
			});

		} else {
			Log.i(TAG, "This device does not support expanding action views. No operation performed.", Log.DEBUG_MODE);
		}
	}

	@Kroll.method @Kroll.getProperty
	public boolean isActionViewExpanded() {
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.ICE_CREAM_SANDWICH) {
			if (TiApplication.isUIThread()) {
				return item.isActionViewExpanded();
			}

			return (Boolean) TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_ACTION_VIEW_EXPANDED));
		}

		// If this system does not support expandable action views, we will
		// always return false since the menu item can never "expand".
		return false;
	}
}
