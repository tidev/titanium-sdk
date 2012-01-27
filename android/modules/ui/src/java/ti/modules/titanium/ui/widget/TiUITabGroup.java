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

	private TabHost tabHost;

	private String lastTabId;
	private int numTabNeededToAdd = 0;
	private boolean addingTab = true;
	private int previousTabID = -1;
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
			tabHost.setBackgroundDrawable(new ColorDrawable(TiConvert.toColor("#ff1a1a1a")));
		}

		setNativeView(tabHost);
		lastTabId = null;
	}

	public TabSpec newTab(String id)
	{
		return tabHost.newTabSpec(id);
	}

	public void addTab(TabSpec tab, final TabProxy tabProxy)
	{
		numTabNeededToAdd++;
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
			TabHost th = (TabHost) getNativeView();
			return ((TabGroupProxy) proxy).buildFocusEvent(th.getCurrentTabTag(), lastTabId);
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
		if (DBG) {
			Log.d(LCAT,"Tab change from " + lastTabId + " to " + id);
		}

		TabProxy previousTab = null;
		int currentTabID = tabHost.getCurrentTab();
		TabProxy currentTab = tabGroupProxy.getTabList().get (currentTabID);
		proxy.setProperty(TiC.PROPERTY_ACTIVE_TAB, currentTab);

		if (!addingTab) {

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

			tabChangeEventData = tabGroupProxy.buildFocusEvent(id, lastTabId);
			//fire focus on current tab as well as its window
			currentTab.fireEvent(TiC.EVENT_FOCUS, tabChangeEventData);
			currentTab.getWindow().fireEvent(TiC.EVENT_FOCUS, null);


		} else {
			numTabNeededToAdd--;
			if (numTabNeededToAdd == 0) {
				addingTab = false;
			}
		}
		lastTabId = id;
		previousTabID = currentTabID;

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
