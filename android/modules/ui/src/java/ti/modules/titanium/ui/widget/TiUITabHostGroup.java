/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import java.lang.ref.WeakReference;
import java.util.ArrayList;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiConfig;
import org.appcelerator.titanium.TiActivity;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiBaseWindowProxy;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;

import ti.modules.titanium.ui.ActivityWindowProxy;
import ti.modules.titanium.ui.TabGroupProxy;
import ti.modules.titanium.ui.TabProxy;
import ti.modules.titanium.ui.TiTabActivity;
import android.app.Activity;
import android.content.Intent;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.view.View;
import android.view.View.OnClickListener;
import android.widget.AdapterView;
import android.widget.TabHost;
import android.widget.TabHost.OnTabChangeListener;
import android.widget.TabHost.TabSpec;

/**
 * Tab group implementation using the TabWidget/TabHost.
 *
 * If the target SDK version and device framework level is
 * bellow 11 we fall back to using the TabWidget for displaying
 * the tabs. Each window provides an activity which the
 * TabHost starts when that window's tab is selected.
 */
public class TiUITabHostGroup extends TiUIAbstractTabGroup
	implements OnTabChangeListener
{
	private static final String LCAT = "TiUITabGroup";
	private static final boolean DBG = TiConfig.LOGD;

	private TabHost tabHost;

	private int previousTabID = -1;
	private int currentTabID = 0;

	private WeakReference<TiTabActivity> weakActivity;
	
	private Drawable defaultDrawable;
	private Drawable defaultSelectedDrawable;
	private boolean cacheDefaults = true;


	public TiUITabHostGroup(TabGroupProxy proxy, Activity activity)
	{
		super(proxy, activity);

		tabHost = ((TiTabActivity) activity).getTabHost();

		// Set to GONE to overcome a NullPointerException
		// deep in Android code in pre api 8.  See Android issue
		// 2772.
		tabHost.setVisibility(View.GONE);
		tabHost.clearAllTabs();
		tabHost.setOnTabChangedListener(this);
		tabHost.setup(((TiTabActivity) activity).getLocalActivityManager());

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
			int currentTabIndex = tabCount - 1;

			tabHost.getTabWidget().getChildTabViewAt(currentTabIndex).setOnClickListener(new OnClickListener()
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

			if (tabCount != 1) {
				setTabBackgroundColor(currentTabIndex);
			}
			
			registerTouchForTabGroup(tabHost.getTabWidget().getChildTabViewAt(tabCount - 1), tabProxy);
		}
	}

	@Override
	public void removeTab(TabProxy tab) {
		// TODO(josh): see if we can implement this, otherwise just leave as a no-op
		// and document this isn't support for this type of tab group.
	}

	public void setActiveTab(int index)
	{
		if (tabHost != null) {
			tabHost.setCurrentTab(index);
		}
	}

	@Override
	public void addTab(TabProxy tab) {
		TiTabActivity tta = weakActivity.get();
		if (tta == null) {
			if (DBG) {
				Log.w(LCAT, "Could not add tab because tab activity no longer exists");
			}
		}
		Object iconProperty = tab.getProperty(TiC.PROPERTY_ICON);
		Drawable icon = TiUIHelper.getResourceDrawable(iconProperty);

		String tag = TiConvert.toString(tab.getProperty(TiC.PROPERTY_TAG));
		String title = TiConvert.toString(tab.getProperty(TiC.PROPERTY_TITLE));
		if (title == null) {
			title = "";
		}

		tab.setTabGroup((TabGroupProxy) proxy);

		ActivityWindowProxy windowProxy = new ActivityWindowProxy();
		windowProxy.setActivity(((TabGroupProxy) proxy).getActivity());

		TiBaseWindowProxy baseWindow = (TiBaseWindowProxy) tab.getProperty(TiC.PROPERTY_WINDOW);
		if (baseWindow != null) {
			windowProxy.handleCreationDict(baseWindow.getProperties());
			tab.setWindow(baseWindow);  // hooks up the tab and the JS window wrapper
			baseWindow.getKrollObject().setWindow(windowProxy);

		} else {
			Log.w(LCAT, "window property was not set on tab");
		}

		if (tag != null && windowProxy != null) {
			TabSpec tspec = newTab(tag);
			if (icon == null) {
				tspec.setIndicator(title);
			} else {
				tspec.setIndicator(title, icon);
			}

			Intent intent = new Intent(tta, TiActivity.class);
			windowProxy.setParent(tab);
			// TODO(josh): remove -> windowProxy.fillIntentForTab(intent, tab);

			tspec.setContent(intent);

			addTab(tspec, tab);
		}
	}

	@Override
	public void selectTab(TabProxy tab) {
		// TODO(josh): implement
	}

	@Override
	public TabProxy getSelectedTab() {
		// TODO(josh): implement
		return null;
	}

	@Override
	public void close() {
		Activity tabActivity = this.weakActivity.get();
		if (tabActivity != null) {
			tabActivity.finish();
			// Finishing an activity is not synchronous, so we remove the activity from the activity stack here
			TiApplication.removeFromActivityStack(tabActivity);
		};
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
		
		// This is the first place we can cache the background info before it gets changed by some of our logic. The
		// first addTab() call from android triggers onTabChanged(), so this is the best place to cache the default
		// drawables.
		if (cacheDefaults) {
			defaultSelectedDrawable = tabHost.getTabWidget().getChildAt(currentTabID).getBackground();
			defaultDrawable = tabHost.getBackground();
			cacheDefaults = false;
		}

		if (DBG) {
			Log.d(LCAT,"Tab change from " + previousTabID + " to " + currentTabID);
		}

		ArrayList<TabProxy> tabs = tabGroupProxy.getTabList();
		TabProxy prevTab = (previousTabID >= 0 ? tabs.get(previousTabID) : null);
		TabProxy currentTab = tabs.get(currentTabID);

		proxy.setProperty(TiC.PROPERTY_ACTIVE_TAB, currentTab);

		// Apply the appropriate background color on all tabs
		for (int i = 0; i < tabHost.getTabWidget().getChildCount(); i++) {
			if (i != currentTabID) {
				setTabBackgroundColor(i);
			}
		}
		setTabBackgroundSelectedColor();
		
		KrollDict tabChangeEventData = tabGroupProxy.buildFocusEvent(currentTabID, previousTabID);
		if (prevTab != null) {
			// Create a clone of the event data since the 'source' needs to be
			// correctly set for the proxy firing the event.
			prevTab.fireEvent(TiC.EVENT_BLUR, tabChangeEventData.clone(), true);
		}
		currentTab.fireEvent(TiC.EVENT_FOCUS, tabChangeEventData, true);

		previousTabID = currentTabID;
	}
	
	public void setTabBackgroundColor(int index) 
	{
		TabGroupProxy tabGroupProxy = (TabGroupProxy) proxy;
		ArrayList<TabProxy> tabs = tabGroupProxy.getTabList();
		TabProxy tProxy = tabs.get(index);
		String color = tProxy.getBackgroundColor();
		String currentColor = tProxy.getCurrentBackgroundColor();
		View tab = tabHost.getTabWidget().getChildAt(index);
		if (color != null) {
			if (!color.equals(currentColor)) {
				tab.setBackgroundColor(TiConvert.toColor(color));
				tProxy.setCurrentBackgroundColor(color);
			}
		} else {
			String tabsColor = tabGroupProxy.getTabsBackgroundColor();
			if (tabsColor != null) {
				if (!tabsColor.equals(currentColor)) {
					tab.setBackgroundColor(TiConvert.toColor(tabsColor));
					tProxy.setCurrentBackgroundColor(tabsColor);
				}
			} else {
				tab.setBackgroundDrawable(defaultDrawable);
				tProxy.setCurrentBackgroundColor("");
			}
		}
		
	}
	
	public void setTabBackgroundSelectedColor() 
	{
		// If we have tabsBackgroundSelectedColor set, apply that color to the current tab
		TabGroupProxy tabGroupProxy = (TabGroupProxy) proxy;
		ArrayList<TabProxy> tabs = tabGroupProxy.getTabList();
		TabProxy tProxy = tabs.get(currentTabID);
		String selColor = tProxy.getBackgroundSelectedColor();
		String currentColor = tProxy.getCurrentBackgroundColor();
		View tab = tabHost.getTabWidget().getChildAt(currentTabID);
		if (selColor != null) {
			if (!selColor.equals(currentColor)) {
				tab.setBackgroundColor(TiConvert.toColor(selColor));
				tProxy.setCurrentBackgroundColor(selColor);
			}
		} else {
			String tabsSelColor = tabGroupProxy.getTabsBackgroundSelectedColor();
			if (tabsSelColor != null) {
				if (!tabsSelColor.equals(currentColor)) {
					tab.setBackgroundColor(TiConvert.toColor(tabsSelColor));
					tProxy.setCurrentBackgroundColor(tabsSelColor);
				}
			} else {
				tab.setBackgroundDrawable(defaultSelectedDrawable);
				tProxy.setCurrentBackgroundColor("");
			}
		}
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
		} else if (TiC.PROPERTY_TABS_BACKGROUND_COLOR.equals(key)) {
			for (int i = 0; i < tabHost.getTabWidget().getChildCount(); i++) {
				setTabBackgroundColor(i);
			}		
		} else if (TiC.PROPERTY_TABS_BACKGROUND_SELECTED_COLOR.equals(key)) {
			setTabBackgroundSelectedColor();
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}
}
