/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.tabgroup;

import java.util.HashMap;

import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBaseActivity;

import ti.modules.titanium.ui.TabGroupProxy;
import ti.modules.titanium.ui.TabProxy;
import android.content.Context;
import android.view.View;
import android.view.ViewGroup.LayoutParams;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TabHost;
import android.widget.TabHost.OnTabChangeListener;
import android.widget.TabHost.TabContentFactory;
import android.widget.TabHost.TabSpec;
import android.widget.TabWidget;

/**
 * Tab group implementation using the TabWidget/TabHost.
 *
 * If the target SDK version and device framework level is
 * bellow 11 we fall back to using the TabWidget for displaying
 * the tabs. Each window provides an activity which the
 * TabHost starts when that window's tab is selected.
 */
public class TiUITabHostGroup extends TiUIAbstractTabGroup
		implements OnTabChangeListener, TabContentFactory {

	private TabHost tabHost;
	private final HashMap<String, TiUITabHostTab> tabViews = new HashMap<String, TiUITabHostTab>();

	public TiUITabHostGroup(TabGroupProxy proxy, TiBaseActivity activity)
	{
		super(proxy, activity);
		setupTabHost();
		activity.setLayout(tabHost);
	}

	private void setupTabHost() {
		Context context = TiApplication.getInstance().getApplicationContext();
		LayoutParams params;

		tabHost = new TabHost(context, null);
		tabHost.setId(android.R.id.tabhost);
		params = new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT);
		tabHost.setLayoutParams(params);
		tabHost.setOnTabChangedListener(this);

		LinearLayout container = new LinearLayout(context);
		container.setOrientation(LinearLayout.VERTICAL);
		params = new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT);
		tabHost.addView(container, params);

		TabWidget tabWidget = new TabWidget(context);
		tabWidget.setId(android.R.id.tabs);
		tabWidget.setOrientation(LinearLayout.HORIZONTAL);
		params = new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT);
		container.addView(tabWidget, params);

		FrameLayout tabcontent = new FrameLayout(context);
		tabcontent.setId(android.R.id.tabcontent);
		params = new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT);
		container.addView(tabcontent, params);

		tabHost.setup();
	}

	@Override
	public void addTab(TabProxy tab) {
		TiUITabHostTab tabView = new TiUITabHostTab(tab);
		tabViews.put(tabView.id, tabView);

		TabSpec tabSpec = tabHost.newTabSpec(tabView.id);
		tabView.setupTabSpec(tabSpec);
		tabSpec.setContent(this);
		tabHost.addTab(tabSpec);
	}

	@Override
	public void removeTab(TabProxy tab) {
		// TODO(josh): see if we can implement this, otherwise just leave as a no-op
		// and document this isn't support for this type of tab group.
	}

	@Override
	public void selectTab(TabProxy tab) {
		TiUITabHostTab tabView = (TiUITabHostTab) tab.peekView();
		tabHost.setCurrentTabByTag(tabView.id);
	}

	@Override
	public TabProxy getSelectedTab() {
		String id = tabHost.getCurrentTabTag();
		TiUITabHostTab tabView = tabViews.get(id);
		return (TabProxy) tabView.getProxy();
	}

	@Override
	public void onTabChanged(String id)
	{
		TabGroupProxy tabGroupProxy = ((TabGroupProxy) proxy);
		TiUITabHostTab tab = tabViews.get(id);
		tabGroupProxy.onTabSelected((TabProxy) tab.getProxy());

		/** TODO(josh): refactor this background color code.
		// This is the first place we can cache the background info before it gets changed by some of our logic. The
		// first addTab() call from android triggers onTabChanged(), so this is the best place to cache the default
		// drawables.
		if (cacheDefaults) {
			defaultSelectedDrawable = tabHost.getTabWidget().getChildAt(currentTabID).getBackground();
			defaultDrawable = tabHost.getBackground();
			cacheDefaults = false;
		}

		// Apply the appropriate background color on all tabs
		for (int i = 0; i < tabHost.getTabWidget().getChildCount(); i++) {
			if (i != currentTabID) {
				setTabBackgroundColor(i);
			}
		}
		setTabBackgroundSelectedColor();
		*/
	}

	@Override
	public View createTabContent(String tag) {
		// TODO(josh): test tabs with empty content view.
		TiUITabHostTab tabView = tabViews.get(tag);
		return tabView.getContentView();
	}

	/** TODO(josh): refactor
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
		TabProxy tProxy = getSelectedTab();
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
	*/

}
