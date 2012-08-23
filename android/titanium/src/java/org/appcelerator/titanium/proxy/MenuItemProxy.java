/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.proxy;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
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
import android.view.MenuItem;
import android.view.MenuItem.OnActionExpandListener;
import android.view.View;

@Kroll.proxy
public class MenuItemProxy extends KrollProxy
{
	private static final String TAG = "MenuItem";

	private MenuItem item;

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

	@Kroll.method @Kroll.getProperty
	public int getGroupId() {
		return item.getGroupId();
	}
	
	@Kroll.method @Kroll.getProperty
	public int getItemId() {
		return item.getItemId();
	}
	
	@Kroll.method @Kroll.getProperty
	public int getOrder() {
		return item.getOrder();
	}
	
	@Kroll.method @Kroll.getProperty
	public String getTitle() {
		return (String) item.getTitle();
	}
	
	@Kroll.method @Kroll.getProperty
	public String getTitleCondensed() {
		return (String) item.getTitleCondensed();
	}
	
	@Kroll.method
	public boolean hasSubMenu() {
		return item.hasSubMenu();
	}
	
	@Kroll.method
	public boolean isChecked() {
		return item.isChecked();
	}
	
	@Kroll.method
	public boolean isCheckable() {
		return item.isCheckable();
	}
	
	@Kroll.method
	public boolean isEnabled() {
		return item.isEnabled();
	}
	
	@Kroll.method
	public boolean isVisible() {
		return item.isVisible();
	}
	
	@Kroll.method @Kroll.setProperty
	public MenuItemProxy setCheckable(boolean checkable) {
		item.setCheckable(checkable);
		return this;
	}
	
	@Kroll.method @Kroll.setProperty
	public MenuItemProxy setChecked(boolean checked) {
		item.setChecked(checked);
		return this;
	}
	
	@Kroll.method @Kroll.setProperty
	public MenuItemProxy setEnabled(boolean enabled) {
		item.setEnabled(enabled);
		return this;
	}
	
	@Kroll.method @Kroll.setProperty
	public MenuItemProxy setIcon(Object icon) 
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
	public MenuItemProxy setTitle(String title) {
		item.setTitle(title);
		return this;
	}
	
	@Kroll.method @Kroll.setProperty
	public MenuItemProxy setTitleCondensed(String title) {
		item.setTitleCondensed(title);
		return this;
	}
	
	@Kroll.method @Kroll.setProperty
	public MenuItemProxy setVisible(boolean visible) {
		item.setVisible(visible);
		return this;
	}

	@Kroll.setProperty
	public void setActionView(TiViewProxy view) {
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.HONEYCOMB) {
			View v = view.getOrCreateView().getNativeView();
			item.setActionView(v);

		} else {
			Log.i(TAG, "Action bar not available on this device. Ignoring actionView property.", Log.DEBUG_MODE);
		}
	}

	@Kroll.setProperty
	public void setShowAsAction(int flag) {
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.HONEYCOMB) {
			item.setShowAsAction(flag);

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

	@Kroll.getProperty
	public boolean isActionViewExpanded() {
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.ICE_CREAM_SANDWICH) {
			return item.isActionViewExpanded();
		}

		// If this system does not support expandable action views, we will
		// always return false since the menu item can never "expand".
		return false;
	}
}
