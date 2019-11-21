/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.proxy;

import org.appcelerator.kroll.KrollDict;
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
import org.appcelerator.titanium.view.TiUIView;

import android.graphics.drawable.Drawable;
import android.support.v4.view.MenuItemCompat;
import android.view.MenuItem;
import android.view.View;

@Kroll.proxy
public class MenuItemProxy extends KrollProxy
{
	private static final String TAG = "MenuItem";

	private MenuItem item;

	private static final int MSG_FIRST_ID = KrollProxy.MSG_LAST_ID + 1;
	protected static final int MSG_LAST_ID = MSG_FIRST_ID + 1000;

	private final class CompatActionExpandListener implements MenuItemCompat.OnActionExpandListener
	{
		public boolean onMenuItemActionCollapse(MenuItem item)
		{
			fireEvent(TiC.EVENT_COLLAPSE, null);
			return true;
		}

		public boolean onMenuItemActionExpand(MenuItem item)
		{
			fireEvent(TiC.EVENT_EXPAND, null);
			return true;
		}
	}

	protected MenuItemProxy(MenuItem item)
	{
		this.item = item;
		MenuItemCompat.setOnActionExpandListener(item, new CompatActionExpandListener());
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public int getGroupId()
	// clang-format on
	{
		return item.getGroupId();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public int getItemId()
	// clang-format on
	{
		return item.getItemId();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public int getOrder()
	// clang-format on
	{
		return item.getOrder();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getTitle()
	// clang-format on
	{
		return (String) item.getTitle();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getTitleCondensed()
	// clang-format on
	{
		return (String) item.getTitleCondensed();
	}

	@Kroll.method
	public boolean hasSubMenu()
	{
		return item.hasSubMenu();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public boolean isChecked()
	// clang-format on
	{
		return item.isChecked();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public boolean isCheckable()
	// clang-format on
	{
		return item.isCheckable();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public boolean isEnabled()
	// clang-format on
	{
		return item.isEnabled();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public boolean isVisible()
	// clang-format on
	{
		return item.isVisible();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getAccessibilityLabel()
	// clang-format on
	{
		return TiConvert.toString(properties, TiC.PROPERTY_ACCESSIBILITY_LABEL);
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getAccessibilityHint()
	// clang-format on
	{
		return TiConvert.toString(properties, TiC.PROPERTY_ACCESSIBILITY_HINT);
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getAccessibilityValue()
	// clang-format on
	{
		return TiConvert.toString(properties, TiC.PROPERTY_ACCESSIBILITY_VALUE);
	}

	private void updateContentDescription()
	{
		String contentDescription = TiUIView.composeContentDescription(properties);
		MenuItemCompat.setContentDescription(item, contentDescription);
	}

	public void setContentDescription(KrollDict d)
	{
		if (d.containsKeyAndNotNull(TiC.PROPERTY_ACCESSIBILITY_LABEL)) {
			properties.put(TiC.PROPERTY_ACCESSIBILITY_LABEL, d.get(TiC.PROPERTY_ACCESSIBILITY_LABEL));
		} else {
			properties.remove(TiC.PROPERTY_ACCESSIBILITY_LABEL);
		}
		if (d.containsKey(TiC.PROPERTY_ACCESSIBILITY_HINT)) {
			properties.put(TiC.PROPERTY_ACCESSIBILITY_HINT, d.get(TiC.PROPERTY_ACCESSIBILITY_HINT));
		} else {
			properties.remove(TiC.PROPERTY_ACCESSIBILITY_HINT);
		}
		if (d.containsKey(TiC.PROPERTY_ACCESSIBILITY_VALUE)) {
			properties.put(TiC.PROPERTY_ACCESSIBILITY_VALUE, d.get(TiC.PROPERTY_ACCESSIBILITY_VALUE));
		} else {
			properties.remove(TiC.PROPERTY_ACCESSIBILITY_VALUE);
		}
		updateContentDescription();
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setAccessibilityLabel(String label)
	// clang-format on
	{
		if (label != null && label.length() != 0) {
			properties.put(TiC.PROPERTY_ACCESSIBILITY_LABEL, label);
		} else {
			properties.remove(TiC.PROPERTY_ACCESSIBILITY_LABEL);
		}
		updateContentDescription();
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setAccessibilityHint(String hint)
	// clang-format on
	{
		if (hint != null && hint.length() != 0) {
			properties.put(TiC.PROPERTY_ACCESSIBILITY_HINT, hint);
		} else {
			properties.remove(TiC.PROPERTY_ACCESSIBILITY_HINT);
		}
		updateContentDescription();
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setAccessibilityValue(String value)
	// clang-format on
	{
		if (value != null && value.length() != 0) {
			properties.put(TiC.PROPERTY_ACCESSIBILITY_VALUE, value);
		} else {
			properties.remove(TiC.PROPERTY_ACCESSIBILITY_VALUE);
		}

		updateContentDescription();
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public MenuItemProxy setCheckable(boolean checkable)
	// clang-format on
	{
		item.setCheckable(checkable);
		return this;
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public MenuItemProxy setChecked(boolean checked)
	// clang-format on
	{
		item.setChecked(checked);
		return this;
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public MenuItemProxy setEnabled(boolean enabled)
	// clang-format on
	{
		item.setEnabled(enabled);
		return this;
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public MenuItemProxy setIcon(Object icon)
	// clang-format on
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

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public MenuItemProxy setTitle(String title)
	// clang-format on
	{
		item.setTitle(title);
		return this;
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public MenuItemProxy setTitleCondensed(String title)
	// clang-format on
	{
		item.setTitleCondensed(title);
		return this;
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public MenuItemProxy setVisible(boolean visible)
	// clang-format on
	{
		item.setVisible(visible);
		return this;
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setActionView(Object view)
	// clang-format on
	{
		if (view instanceof TiViewProxy) {
			final View v = ((TiViewProxy) view).getOrCreateView().getNativeView();
			TiMessenger.postOnMain(new Runnable() {
				@Override
				public void run()
				{
					item.setActionView(v);
				}
			});
		} else {
			Log.w(TAG, "Invalid type for actionView", Log.DEBUG_MODE);
		}
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setShowAsAction(final int flag)
	// clang-format on
	{
		TiMessenger.postOnMain(new Runnable() {
			@Override
			public void run()
			{
				item.setShowAsAction(flag);
			}
		});
	}

	@Kroll.method
	public void collapseActionView()
	{
		TiMessenger.postOnMain(new Runnable() {
			@Override
			public void run()
			{
				item.collapseActionView();
			}
		});
	}

	@Kroll.method
	public void expandActionView()
	{
		TiMessenger.postOnMain(new Runnable() {
			@Override
			public void run()
			{
				item.expandActionView();
			}
		});
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public boolean isActionViewExpanded()
	// clang-format on
	{
		return item.isActionViewExpanded();
	}

	@Override
	public String getApiName()
	{
		return "Ti.Android.MenuItem";
	}
}
