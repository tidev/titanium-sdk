/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.tabgroup;

import java.util.HashMap;
import java.util.Map.Entry;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiCompositeLayout;

import ti.modules.titanium.ui.TabGroupProxy;
import ti.modules.titanium.ui.TabProxy;
import android.content.Context;
import android.util.Log;
import android.view.View;
import android.view.View.OnClickListener;
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

	private static final String TAG = "TiUITabHostGroup";

	private TabHost tabHost;
	private final HashMap<String, TiUITabHostTab> tabViews = new HashMap<String, TiUITabHostTab>();

	public TiUITabHostGroup(TabGroupProxy proxy, TiBaseActivity activity)
	{
		super(proxy, activity);
		setupTabHost();

		TiCompositeLayout.LayoutParams params = new TiCompositeLayout.LayoutParams();
		params.autoFillsHeight = true;
		params.autoFillsWidth = true;

		((TiCompositeLayout) activity.getLayout()).addView(tabHost, params);
	}

	private void setupTabHost() {
		Context context = TiApplication.getInstance().getApplicationContext();
		LayoutParams params;

		tabHost = new TabHost(context, null);
		tabHost.setId(android.R.id.tabhost);
		params = new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT);
		tabHost.setLayoutParams(params);

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
	public void addTab(final TabProxy tab) {
		TabWidget tabWidget = tabHost.getTabWidget();

		final int tabIndex = tabHost.getTabWidget().getTabCount();

		TiUITabHostTab tabView = new TiUITabHostTab(tab);
		tabViews.put(tabView.id, tabView);

		TabSpec tabSpec = tabHost.newTabSpec(tabView.id);
		tabView.setupTabSpec(tabSpec);
		tabSpec.setContent(this);
		tabHost.addTab(tabSpec);

		tabView.setIndicatorView(tabWidget.getChildTabViewAt(tabIndex));

		// TabHost will automatically select the first tab.
		// We must suppress the tab selection callback when this selection
		// happens to comply with the abstract tab group contract.
		// We will only hook up the tab listener after the first tab is added.
		if (tabIndex == 0) {
			tabHost.setOnTabChangedListener(this);
		}

		tabHost.getTabWidget().getChildTabViewAt(tabIndex).setOnClickListener(new OnClickListener()
		{
			@Override
			public void onClick(View v)
			{
				// The default click listener for tab views is responsible for changing the selected tabs.
				tabHost.setCurrentTab(tabIndex);

				tab.fireEvent(TiC.EVENT_CLICK, null);
			}
		});
	}

	@Override
	public void removeTab(TabProxy tab) {
		// Not supported.
		Log.w(TAG, "Tab removal not supported by this group.");
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
	}

	@Override
	public View createTabContent(String tag) {
		TiUITabHostTab tabView = tabViews.get(tag);
		return tabView.getContentView();
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy) {
		if (key.equals(TiC.PROPERTY_TABS_BACKGROUND_COLOR)) {
			String activeTab = tabHost.getCurrentTabTag();
			int color = TiConvert.toColor(newValue.toString());

			// Update each inactive tab to the new background color.
			for (Entry<String, TiUITabHostTab> e : tabViews.entrySet()) {
				if (e.getKey() == activeTab) {
					continue;
				}
				e.getValue().setBackgroundColor(color);
			}

		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

}
