/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiConfig;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.TabGroupProxy;
import ti.modules.titanium.ui.TabProxy;
import ti.modules.titanium.ui.TiTabActivity;
import android.graphics.drawable.ColorDrawable;
import android.view.View;
import android.view.View.OnClickListener;
import android.widget.TabHost;
import android.widget.TabHost.OnTabChangeListener;
import android.widget.TabHost.TabSpec;

public class TiUITabGroup extends TiUIView
	implements OnTabChangeListener
{
	private static final String LCAT = "TiUITabGroup";
	private static final boolean DBG = TiConfig.LOGD;
	private static final int DEFAULT_TAB_BACKGROUND_COLOR = TiConvert.toColor("#ff1a1a1a");

	private TabHost tabHost;

	private int previousTabID = -1;
	private int currentTabID = 0;
	private KrollDict tabChangeEventData;

	public TiUITabGroup(TiViewProxy proxy, TiTabActivity activity)
	{
		super(proxy);
		tabHost = activity.getTabHost();
		// Set to GONE to overcome a NullPointerException
		// deep in Android code in pre api 8.  See Android issue
		// 2772.
		tabHost.setVisibility(View.GONE);
		tabHost.clearAllTabs();
		tabHost.setOnTabChangedListener(this);
		tabHost.setup(activity.getLocalActivityManager());

		Object bgColor = proxy.getProperty(TiC.PROPERTY_BACKGROUND_COLOR);
		if (bgColor != null) {
			tabHost.setBackgroundColor(TiConvert.toColor(bgColor.toString()));
		} else {
			tabHost.setBackgroundDrawable(new ColorDrawable(DEFAULT_TAB_BACKGROUND_COLOR));
		}

		setNativeView(tabHost);
	}

	public TabSpec newTab(String id)
	{
		return tabHost.newTabSpec(id);
	}

	public void addTab(TabSpec tab, final TabProxy tabProxy)
	{
		tabHost.addTab(tab);
		if (tabHost.getVisibility() == View.GONE) {
			boolean visibilityPerProxy = true; // default
			if (proxy.hasProperty(TiC.PROPERTY_VISIBLE)) {
				visibilityPerProxy = TiConvert.toBoolean(proxy.getProperty(TiC.PROPERTY_VISIBLE));
			}
			if (visibilityPerProxy) {
				tabHost.setVisibility(View.VISIBLE);
			} else {
				tabHost.setVisibility(View.INVISIBLE);
			}
		}
		final int tabCount = tabHost.getTabWidget().getTabCount();
		if (tabCount > 0) {
			tabHost.getTabWidget().getChildTabViewAt(tabCount - 1).setOnClickListener(new OnClickListener()
			{
				@Override
				public void onClick(View v)
				{
					// We have to set the current tab here to restore the widget's default behavior since
					// setOnClickListener seems to overwrite it
					tabHost.setCurrentTab(tabCount - 1);
					tabProxy.fireEvent(TiC.EVENT_CLICK, null);
				}
			});
		}
		if (proxy.hasProperty(TiC.PROPERTY_TABS_BACKGROUND_COLOR)) {
			tabHost.getTabWidget().getChildAt(tabCount - 1)
				.setBackgroundColor(TiConvert.toColor(proxy.getProperty(TiC.PROPERTY_TABS_BACKGROUND_COLOR).toString()));
		}

	}

	public void setActiveTab(int index)
	{
		if (tabHost != null) {
			tabHost.setCurrentTab(index);
		}
	}

	@Override
	protected KrollDict getFocusEventObject(boolean hasFocus)
	{
		if (tabChangeEventData == null) {
			return ((TabGroupProxy) proxy).buildFocusEvent(currentTabID, previousTabID);
		} else {
			return tabChangeEventData;
		}
	}

	@Override
	public void onFocusChange(View v, boolean hasFocus)
	{
		// ignore focus change for tab group.
		// we can simply fire focus/blur from onTabChanged (to avoid chicken/egg event problems)
	}

	@Override
	public void onTabChanged(String id)
	{
		TabGroupProxy tabGroupProxy = ((TabGroupProxy) proxy);

		TabProxy previousTab = null;
		currentTabID = tabHost.getCurrentTab();
		
		if (DBG) {
			Log.d(LCAT,"Tab change from " + previousTabID + " to " + currentTabID);
		}
		
		TabProxy currentTab = tabGroupProxy.getTabList().get(currentTabID);
		proxy.setProperty(TiC.PROPERTY_ACTIVE_TAB, currentTab);

		proxy.setProperty(TiC.PROPERTY_ACTIVE_TAB, tabGroupProxy.getTabList().get(tabHost.getCurrentTab()));

		if (previousTabID != -1) {
			previousTab = tabGroupProxy.getTabList().get(previousTabID);
		}

		if (tabChangeEventData != null) {
			//fire blur on previous tab as well as its window
			if (previousTab != null) {
				previousTab.fireEvent(TiC.EVENT_BLUR, tabChangeEventData);
				previousTab.getWindow().fireEvent(TiC.EVENT_BLUR, null);
			}
		}

		if (proxy.hasProperty(TiC.PROPERTY_TABS_BACKGROUND_COLOR)) {

			// If we have tabsBackgroundColor set, apply that color to all the tabs when it's changed
			for (int i = 0; i < tabHost.getTabWidget().getChildCount(); i++) {
				tabHost.getTabWidget().getChildAt(i)
					.setBackgroundColor(TiConvert.toColor(proxy.getProperty(TiC.PROPERTY_TABS_BACKGROUND_COLOR).toString()));
			}

			// If we have tabsBackgroundSelectedColor set, apply that color to the current tab
			if (proxy.hasProperty(TiC.PROPERTY_TABS_BACKGROUND_SELECTED_COLOR)) {
				updateSelectedBackgroundColor();
			}

		} else if (proxy.hasProperty(TiC.PROPERTY_TABS_BACKGROUND_SELECTED_COLOR)) {

			// If we only have tabsBackgroundSelectedColor set, apply the default background color to all the tabs, then
			// apply that color to the current tab
			for (int i = 0; i < tabHost.getTabWidget().getChildCount(); i++) {
				tabHost.getTabWidget().getChildAt(i).setBackgroundColor(DEFAULT_TAB_BACKGROUND_COLOR);
			}
			updateSelectedBackgroundColor();

		}

		lastTabId = id;

		tabChangeEventData = tabGroupProxy.buildFocusEvent(currentTabID, previousTabID);
		//fire focus on current tab as well as its window
		currentTab.fireEvent(TiC.EVENT_FOCUS, tabChangeEventData);
		currentTab.getWindow().fireEvent(TiC.EVENT_FOCUS, null);


		
		previousTabID = currentTabID;

	}

	private void updateSelectedBackgroundColor()
	{
		int selectedBGColor = TiConvert.toColor(proxy.getProperty(TiC.PROPERTY_TABS_BACKGROUND_SELECTED_COLOR).toString());
		tabHost.getTabWidget().getChildAt(tabHost.getCurrentTab()).setBackgroundColor(selectedBGColor);
	}

	public void changeActiveTab(Object t)
	{
		if (t != null) {
			Integer index = null;
			if (t instanceof Number) {
				index = TiConvert.toInt(t);

				int len = tabHost.getTabWidget().getTabCount();
				if (index >= len) {
					// TODO consider throwing an exception to JS.
					Log.w(LCAT, "Index out of bounds. Attempt to set active tab to " + index + ". There are " + len + " tabs.");
					index = null;
				} else {
					tabHost.setCurrentTab(index);
				}
			} else if (t instanceof TabProxy) {
				TabProxy tab = (TabProxy) t;
				String tag = TiConvert.toString(tab.getProperty("tag"));
				if (tag != null) {
					tabHost.setCurrentTabByTag(tag);
				}
			} else {
				Log.w(LCAT, "Attempt to set active tab using a non-supported argument. Ignoring");
			}
		}

		if (proxy.hasProperty(TiC.PROPERTY_TABS_BACKGROUND_SELECTED_COLOR)) {
			updateSelectedBackgroundColor();
		}

	}

	public int getActiveTab()
	{
		if(tabHost != null) {
			return tabHost.getCurrentTab();
		} else {
			return -1;
		}
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		if ("activeTab".equals(key)) {
			changeActiveTab(newValue);
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}
}
