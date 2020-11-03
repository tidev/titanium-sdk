/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2018 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import android.graphics.drawable.Drawable;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.android.material.tabs.TabLayout;
import android.view.MenuItem;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiColorHelper;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiDrawableReference;
import org.appcelerator.titanium.view.TiUIView;

import java.util.ArrayList;
import java.util.HashMap;

import ti.modules.titanium.ui.android.AndroidModule;

public class TiUITabbedBar extends TiUIView implements MenuItem.OnMenuItemClickListener, TabLayout.OnTabSelectedListener
{
	private static final String TAG = "TiUITabbedBar";

	private TabLayout tabLayout;
	private BottomNavigationView bottomNavigationView;
	private int style = AndroidModule.TABS_STYLE_DEFAULT;
	private ArrayList<MenuItem> bottomNavigationMenuItems = new ArrayList<>();
	private int bottomNavigationIndex = -1;
	private boolean skipClickEvent = false;

	/**
	 * Constructs a TiUIView object with the associated proxy.
	 *
	 * @param proxy the associated proxy.
	 * @module.api
	 */
	public TiUITabbedBar(TiViewProxy proxy)
	{
		super(proxy);

		Object styleObject = proxy.getProperty(TiC.PROPERTY_STYLE);
		if (styleObject instanceof Number) {
			this.style = TiConvert.toInt(styleObject, this.style);
		} else if (styleObject != null) {
			Log.w(TAG, "TabbedBar '" + TiC.PROPERTY_STYLE
						   + "' property must be set to a 'Ti.UI.Module' TABS_STYLE constant.");
		} else {
			proxy.setProperty(TiC.PROPERTY_STYLE, this.style);
		}

		switch (this.style) {
			case AndroidModule.TABS_STYLE_DEFAULT:
				createTabLayout();
				break;
			case AndroidModule.TABS_STYLE_BOTTOM_NAVIGATION:
				createBottomNavigationView();
				break;
			default:
				Log.w(TAG, "TabbedBar '" + TiC.PROPERTY_STYLE
							   + "' property was assigned an unknown value. Using default style instead.");
				this.style = AndroidModule.TABS_STYLE_DEFAULT;
				createTabLayout();
				break;
		}
	}

	private void createTabLayout()
	{
		this.tabLayout = new TabLayout(getProxy().getActivity()) {
			@Override
			protected void onLayout(boolean changed, int l, int t, int r, int b)
			{
				super.onLayout(changed, l, t, r, b);
				TiUIHelper.firePostLayoutEvent(getProxy());
			}
		};
		this.parseDataSet();
		this.tabLayout.addOnTabSelectedListener(this);
		// For now use the proxy's selectedBackgroundColor for selected indicator
		if (getProxy().hasPropertyAndNotNull(TiC.PROPERTY_SELECTED_BACKGROUND_COLOR)) {
			this.tabLayout.setSelectedTabIndicatorColor(
				TiColorHelper.parseColor(getProxy().getProperty(TiC.PROPERTY_SELECTED_BACKGROUND_COLOR).toString()));
		}
		setNativeView(this.tabLayout);
	}

	private void createBottomNavigationView()
	{
		this.bottomNavigationMenuItems = new ArrayList<>();
		this.bottomNavigationView = new BottomNavigationView(getProxy().getActivity()) {
			@Override
			protected void onLayout(boolean changed, int left, int top, int right, int bottom)
			{
				super.onLayout(changed, left, top, right, bottom);
				TiUIHelper.firePostLayoutEvent(getProxy());
			}
		};
		this.bottomNavigationView.setItemIconTintList(null);
		parseDataSet();
		this.bottomNavigationView.getSelectedItemId();
		// For now by default select the first index.
		bottomNavigationIndex = 0;
		setNativeView(this.bottomNavigationView);
	}

	@Override
	public void processProperties(KrollDict properties)
	{
		// Validate.
		if (properties == null) {
			return;
		}

		// Apply given properties to view.
		if (properties.containsKey(TiC.PROPERTY_INDEX)) {
			setSelectedIndex(properties.get(TiC.PROPERTY_INDEX));
		}

		// Let base class handle all other view property settings.
		super.processProperties(properties);
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		// Validate.
		if (key == null) {
			return;
		}

		// Handle property change.
		if (key.equals(TiC.PROPERTY_INDEX)) {
			setSelectedIndex(newValue);
		} else if (key.equals(TiC.PROPERTY_LABELS)) {
			setNewLabels();
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	private void parseDataSet()
	{
		Object[] labels = ((Object[]) getProxy().getProperty(TiC.PROPERTY_LABELS));
		if (labels == null || labels.length == 0) {
			return;
		}

		// BottomNavigationView only supports up to 5 menu items
		if (style == AndroidModule.TABS_STYLE_BOTTOM_NAVIGATION && labels.length > 5) {
			Log.e(TAG, "Bottom Navigation style supports up to five items in the menu.");
			return;
		}

		// Currently mixed data sets (Labels/BarItemType) are not supported
		// Data set is simple labels
		if (labels[0] instanceof String) {
			for (int i = 0; i < labels.length; i++) {
				addItem(labels[i].toString());
			}
			return;
		}

		// Data set is BarItemType
		for (int i = 0; i < labels.length; i++) {
			// Create a map record from BarItemType
			HashMap item = ((HashMap) labels[i]);
			// The proxy has an "image" property
			if (item.containsKey(TiC.PROPERTY_IMAGE)) {
				// Try to load a drawable from the property
				Drawable drawable =
					TiDrawableReference.fromObject(getProxy(), item.get(TiC.PROPERTY_IMAGE)).getDrawable();
				// If a drawable is successfully loaded add it as an icon and proceed to the next item.
				if (drawable != null) {
					addItem(drawable);
					continue;
				}
				// If drawable was not loaded successfully try to fallback to a title.
				// If we have a title - use it.
				if (item.containsKey(TiC.PROPERTY_TITLE)) {
					addItem(item.get(TiC.PROPERTY_TITLE));
					continue;
				}
				// Otherwise add an empty button (parity with iOS)
				addItem(null);
			}
			if (item.containsKey(TiC.PROPERTY_TITLE)) {
				addItem(item.get(TiC.PROPERTY_TITLE));
			}
		}
	}

	private void addItem(Object value)
	{
		switch (this.style) {
			case AndroidModule.TABS_STYLE_DEFAULT:
				TabLayout.Tab tab = this.tabLayout.newTab();
				if (value != null) {
					if (value instanceof Drawable) {
						tab.setIcon(((Drawable) value));
					} else {
						tab.setText(value.toString());
					}
				}
				this.tabLayout.addTab(tab);
				break;
			case AndroidModule.TABS_STYLE_BOTTOM_NAVIGATION:
				MenuItem menuItem = this.bottomNavigationView.getMenu().add(null);
				menuItem.setOnMenuItemClickListener(this);
				this.bottomNavigationMenuItems.add(menuItem);
				if (value != null) {
					if (value instanceof Drawable) {
						menuItem.setIcon(((Drawable) value));
					} else {
						menuItem.setTitle(value.toString());
					}
				}
				break;
		}
	}

	// Handle switching styles after creation
	public void setNewStyle(int newStyle)
	{
		// If the new style value equals the currently set do nothing
		if ((newStyle == AndroidModule.TABS_STYLE_DEFAULT && tabLayout != null)
			|| (newStyle == AndroidModule.TABS_STYLE_BOTTOM_NAVIGATION && bottomNavigationView != null)) {
			return;
		}
		this.style = newStyle;
		// Labels are not changed at this very moment
		// so recreate the native view with the proper style.
		switch (newStyle) {
			case AndroidModule.TABS_STYLE_DEFAULT:
				// Reset everything related to the TABBED_BAR_STYLE_BOTTOM_NAVIGATION style
				break;
			case AndroidModule.TABS_STYLE_BOTTOM_NAVIGATION:
				// Reset everything related to the DEFAULT_VIEW style
				break;
		} // end of switch
	}

	// Recreate the native views from scratch in case the data set has been changed
	public void setNewLabels()
	{
		skipClickEvent = true;
		switch (((int) getProxy().getProperty(TiC.PROPERTY_STYLE))) {
			case AndroidModule.TABS_STYLE_DEFAULT:
				if (this.tabLayout != null) {
					this.tabLayout.removeAllTabs();
				}
				break;
			case AndroidModule.TABS_STYLE_BOTTOM_NAVIGATION:
				if (bottomNavigationView != null) {
					// Reset the default index
					// This may be changed to persist the selected index in the future
					bottomNavigationIndex = 0;
					bottomNavigationView.getMenu().clear();
					bottomNavigationMenuItems.clear();
				}
				break;
		}
		parseDataSet();
		skipClickEvent = false;
	}

	private void setSelectedIndex(Object value)
	{
		if (value instanceof Number) {
			setSelectedIndex(TiConvert.toInt(value, -1));
		} else if (value != null) {
			Log.w(TAG, "TabbedBar '" + TiC.PROPERTY_INDEX + "' property must be set to a number.");
		} else {
			Log.w(TAG, "TabbedBar '" + TiC.PROPERTY_INDEX
						   + "' property does not support null assignments to clear the selection on Android.");
		}
	}

	public void setSelectedIndex(int i)
	{
		// Validate argument.
		if ((i < 0) || (i >= getTabCount())) {
			Log.e(TAG, "Given TabbedBar index '" + i + "' is out of range.");
			return;
		}

		// Select the indexed tab.
		switch (this.style) {
			case AndroidModule.TABS_STYLE_DEFAULT:
				this.tabLayout.getTabAt(i).select();
				break;
			case AndroidModule.TABS_STYLE_BOTTOM_NAVIGATION:
				this.bottomNavigationView.getMenu().getItem(i).setChecked(true);
				this.bottomNavigationIndex = i;
				break;
		}
	}

	public int getSelectedIndex()
	{
		switch (style) {
			case AndroidModule.TABS_STYLE_DEFAULT:
				return tabLayout.getSelectedTabPosition();
			case AndroidModule.TABS_STYLE_BOTTOM_NAVIGATION:
				return bottomNavigationIndex;
			default:
				return -1;
		} // end of switch
	}

	@Override
	public boolean onMenuItemClick(MenuItem item)
	{
		this.bottomNavigationIndex = this.bottomNavigationMenuItems.indexOf(item);
		onTabIndexChangedTo(this.bottomNavigationIndex);
		return false;
	}

	@Override
	public void onTabSelected(TabLayout.Tab tab)
	{
		if (tab != null) {
			onTabIndexChangedTo(tab.getPosition());
		}
	}

	private void onTabIndexChangedTo(int index)
	{
		KrollProxy proxy = getProxy();
		if (proxy != null) {
			// First, update the proxy's "index" property.
			proxy.setProperty(TiC.PROPERTY_INDEX, index);

			// Last, fire a "click" event.
			if (!skipClickEvent) {
				KrollDict data = new KrollDict();
				data.put(TiC.PROPERTY_INDEX, index);
				proxy.fireEvent(TiC.EVENT_CLICK, data);
			}
		}
	}

	@Override
	public void onTabUnselected(TabLayout.Tab tab)
	{
		// No override
	}

	@Override
	public void onTabReselected(TabLayout.Tab tab)
	{
		// No override
	}

	private int getTabCount()
	{
		switch (this.style) {
			case AndroidModule.TABS_STYLE_DEFAULT:
				return this.tabLayout.getTabCount();
			case AndroidModule.TABS_STYLE_BOTTOM_NAVIGATION:
				return this.bottomNavigationView.getMenu().size();
		}
		return 0;
	}
}
