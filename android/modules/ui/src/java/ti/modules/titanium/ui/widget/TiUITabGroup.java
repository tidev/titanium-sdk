/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import java.util.ArrayList;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiConfig;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiBaseWindowProxy;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.TabGroupProxy;
import ti.modules.titanium.ui.TabProxy;
import ti.modules.titanium.ui.TiTabActivity;
import android.graphics.drawable.ColorDrawable;
import android.view.View;
import android.view.View.OnClickListener;
import android.widget.AdapterView;
import android.widget.TabHost;
import android.widget.TabHost.OnTabChangeListener;
import android.widget.TabHost.TabSpec;

public class TiUITabGroup extends TiUIView
	implements OnTabChangeListener
{
	private static final String LCAT = "TiUITabGroup";
	private static final boolean DBG = TiConfig.LOGD;

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
			tabHost.setBackgroundDrawable(new ColorDrawable(TiConvert.toColor("#ff1a1a1a")));
		}

		setNativeView(tabHost);
	}

	public TabSpec newTab(String id)
	{
		return tabHost.newTabSpec(id);
	}

	protected void registerTouchForTabGroup(final View touchable, final TabProxy tabProxy)
	{
		if (touchable == null) {
			return;
		}
		
		registerTouchEvents(touchable);

		final int tabCount = tabHost.getTabWidget().getTabCount();
		
		boolean clickable = touchable.isClickable();
		if (!clickable) {
			touchable.setOnClickListener(null); // This will set clickable to true in the view, so make sure it stays here so the next line turns it off.
			touchable.setClickable(false);
			touchable.setOnLongClickListener(null);
			touchable.setLongClickable(false);
		} else if ( ! (touchable instanceof AdapterView) ) {
			// n.b.: AdapterView throws if click listener set.
			// n.b.: setting onclicklistener automatically sets clickable to true.
			touchable.setOnClickListener(new OnClickListener()
			{
				public void onClick(View v)
				{
					// We have to set the current tab here to restore the widget's default behavior since
					// setOnClickListener seems to overwrite it
					tabHost.setCurrentTab(tabCount - 1);
					tabProxy.fireEvent(TiC.EVENT_CLICK, null);
				}
			});
			setOnLongClickListener(touchable);
		}
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
			registerTouchForTabGroup(tabHost.getTabWidget().getChildTabViewAt(tabCount - 1), tabProxy);
		}
	}

	public void setActiveTab(int index)
	{
		if (tabHost != null) {
			tabHost.setCurrentTab(index);
		}
	}

	public KrollDict getTabChangeEvent() {
		if (tabChangeEventData != null) {
			// Return a copy since this may get modified by the caller.
			return new KrollDict(tabChangeEventData);
		}

		return null;
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

	@SuppressWarnings("unused")
	private TiViewProxy getTabWindow(TabProxy tab)
	{
		TiViewProxy viewProxy = tab.getWindow();
		if (viewProxy instanceof TiBaseWindowProxy) {
			TiViewProxy wrappedViewProxy = ((TiBaseWindowProxy) viewProxy).getWrappedView();
			if (wrappedViewProxy != null) {
				viewProxy = wrappedViewProxy;
			}
		}

		return viewProxy;
	}

	@Override
	public void onTabChanged(String id)
	{
		TabGroupProxy tabGroupProxy = ((TabGroupProxy) proxy);

		currentTabID = tabHost.getCurrentTab();
		
		if (DBG) {
			Log.d(LCAT,"Tab change from " + previousTabID + " to " + currentTabID);
		}

		TabProxy currentTab = tabGroupProxy.getTabList().get(currentTabID);
		proxy.setProperty(TiC.PROPERTY_ACTIVE_TAB, currentTab);

		tabChangeEventData = tabGroupProxy.buildFocusEvent(currentTabID, previousTabID);
		previousTabID = currentTabID;

	}
	
	public void setTabIndicatorSelected(Object t)
	{
		ArrayList<TabProxy> tabList = ((TabGroupProxy)proxy).getTabList();
		
		if (t != null && tabList != null) {	
			int index = -1;
			int len = tabList.size();
			
			if (t instanceof Number) {
				index = TiConvert.toInt(t);
				if (index >= len) {
					return;
				}
			} else if (t instanceof TabProxy) {
				TabProxy tab = (TabProxy) t;
				for (int i=0; i<len; i++) {
					if (tabList.get(i) == tab) {
						index = i;
						break;
					}
				}
			} else {
				Log.w(LCAT, "Attempt to set tab indicator using a non-supported argument. Ignoring");
				return;
			}
			
			if (index >= 0) {
				View tabIndicator = tabHost.getTabWidget().getChildTabViewAt(index);
				if (!tabIndicator.isSelected()) {
					tabIndicator.setSelected(true);
				}
			}
		}
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
