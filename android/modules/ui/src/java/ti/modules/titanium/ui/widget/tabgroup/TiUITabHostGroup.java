/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.tabgroup;

import java.util.HashMap;

import org.appcelerator.titanium.TiApplication;

import ti.modules.titanium.ui.TabGroupProxy;
import ti.modules.titanium.ui.TabProxy;
import android.app.Activity;
import android.widget.Button;
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
public class TiUITabHostGroup extends TiUIAbstractTabGroup implements OnTabChangeListener
{
	private static final String TAG = "TiUITabGroup";

	private TabHost tabHost;
	private HashMap<String, TiUITabHostTab> tabViews = new HashMap<String, TiUITabHostTab>();

	public TiUITabHostGroup(TabGroupProxy proxy, Activity activity)
	{
		super(proxy, activity);

		tabHost = (TabHost) activity.findViewById(android.R.id.tabhost);
		tabHost.setOnTabChangedListener(this);
		tabHost.setup();
	}

	@Override
	public void addTab(TabProxy tab) {
		/* TODO(josh): move into TiUITab view?
		Object iconProperty = tab.getProperty(TiC.PROPERTY_ICON);
		Drawable icon = TiUIHelper.getResourceDrawable(iconProperty);
		*/

		/* TODO(josh): move
		String title = TiConvert.toString(tab.getProperty(TiC.PROPERTY_TITLE));
		if (title == null) {
			title = "";
		}
		*/

		TiUITabHostTab tabView = new TiUITabHostTab(tab);
		TabSpec spec = tabHost.newTabSpec(tabView.id);
		tabViews.put(tabView.id, tabView);

		spec.setIndicator("Hello!");

		Button btn = new Button(TiApplication.getInstance().getApplicationContext());
		btn.setText("click, me!");
		btn.setId(1);
		tabHost.getTabContentView().addView(btn);
		spec.setContent(1);

		tabHost.addTab(spec);
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
