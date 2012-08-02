/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import java.util.ArrayList;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.AsyncResult;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiConfig;
import org.appcelerator.kroll.common.TiMessenger;
import org.appcelerator.titanium.TiActivity;
import org.appcelerator.titanium.TiActivityWindow;
import org.appcelerator.titanium.TiActivityWindows;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.TiWindowProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;

import ti.modules.titanium.ui.widget.TiUIAbstractTabGroup;
import ti.modules.titanium.ui.widget.TiUIActionBarTabGroup;
import ti.modules.titanium.ui.widget.TiUITabHostGroup;
import android.app.Activity;
import android.content.Intent;
import android.os.Build;
import android.os.Message;

@Kroll.proxy(creatableInModule=UIModule.class, propertyAccessors={
	TiC.PROPERTY_TABS_BACKGROUND_COLOR,
	TiC.PROPERTY_TABS_BACKGROUND_SELECTED_COLOR	
})

public class TabGroupProxy extends TiWindowProxy implements TiActivityWindow
{
	private static final String LCAT = "TabGroupProxy";
	private static boolean DBG = TiConfig.LOGD;

	private static final int MSG_FIRST_ID = TiWindowProxy.MSG_LAST_ID + 1;

	private static final int MSG_ADD_TAB = MSG_FIRST_ID + 100;
	private static final int MSG_REMOVE_TAB = MSG_FIRST_ID + 101;
	private static final int MSG_SET_ACTIVE_TAB = MSG_FIRST_ID + 102;
	private static final int MSG_GET_ACTIVE_TAB = MSG_FIRST_ID + 103;

	protected static final int MSG_LAST_ID = MSG_FIRST_ID + 999;

	private ArrayList<TabProxy> tabs = new ArrayList<TabProxy>();

	public TabGroupProxy()
	{
		super();
	}

	public TabGroupProxy(TiContext tiContext)
	{
		this();
	}

	public String getTabsBackgroundColor() {
		if (hasProperty(TiC.PROPERTY_TABS_BACKGROUND_COLOR)) {
			return getProperty(TiC.PROPERTY_TABS_BACKGROUND_COLOR).toString();
		} else {
			return null;
		}
	}
	
	public String getTabsBackgroundSelectedColor() {
		if (hasProperty(TiC.PROPERTY_TABS_BACKGROUND_SELECTED_COLOR)) {
			return getProperty(TiC.PROPERTY_TABS_BACKGROUND_SELECTED_COLOR).toString();
		} else {
			return null;
		}
	}

	@Override
	public boolean handleMessage(Message msg)
	{
		switch (msg.what) {
			case MSG_ADD_TAB : {
				AsyncResult result = (AsyncResult) msg.obj;
				handleAddTab((TabProxy) result.getArg());
				result.setResult(null); // signal added
				return true;
			}
			case MSG_REMOVE_TAB : {
				AsyncResult result = (AsyncResult) msg.obj;
				handleRemoveTab((TabProxy) result.getArg());
				result.setResult(null); // signal added
				return true;
			}
			case MSG_SET_ACTIVE_TAB: {
				AsyncResult result = (AsyncResult) msg.obj;
				handleSetActiveTab((TabProxy) result.getArg());
				return true;
			}
			case MSG_GET_ACTIVE_TAB: {
				AsyncResult result = (AsyncResult) msg.obj;
				result.setResult(handleGetActiveTab());
				return true;
			}
			default : {
				return super.handleMessage(msg);
			}
		}
	}

	@Kroll.getProperty @Kroll.method
	public TabProxy[] getTabs()
	{
		TabProxy[] tps = null;

		if (tabs != null) {
			tps = tabs.toArray(new TabProxy[tabs.size()]);
		}

		return tps;
	}


	public ArrayList<TabProxy> getTabList()
	{
		return tabs;
	}


	@Kroll.method
	public void addTab(TabProxy tab)
	{
		if (TiApplication.isUIThread()) {
			handleAddTab(tab);

			return;
		}

		TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_ADD_TAB), tab);
	}

	private void handleAddTab(TabProxy tab)
	{
		String tag = TiConvert.toString(tab.getProperty(TiC.PROPERTY_TAG) );
		if (tag == null) {
			//since tag is used to create tabSpec, it must be unique, otherwise tabs with same tag will use same activity (Timob-7487)
			tag = tab.toString();
			tab.setProperty(TiC.PROPERTY_TAG, tag);
		}

		tabs.add(tab);

		TiUIActionBarTabGroup tabGroup = (TiUIActionBarTabGroup) view;
		if (tabGroup != null) {
			tabGroup.addTab(tab);
		}
	}

	@Kroll.method
	public void removeTab(TabProxy tab) { }
	public void handleRemoveTab(TabProxy tab) { }

	@Kroll.setProperty @Kroll.method
	public void setActiveTab(Object tabOrIndex)
	{
		TabProxy tab;
		if (tabOrIndex instanceof Number) {
			// TODO(josh): handle out-of-bound exceptions.
			int tabIndex = ((Number) tabOrIndex).intValue();
			tab = tabs.get(tabIndex);

		} else if (tabOrIndex instanceof TabProxy) {
			// TODO(josh): should check if this tab is in this group.
			tab = (TabProxy) tabOrIndex;

		} else {
			// TODO(josh): verify this is converted to a JS exception, otherwise just log an error.
			throw new IllegalArgumentException("First argument must be a tab object or a numeric index.");
		}

		if (TiApplication.isUIThread()) {
			handleSetActiveTab(tab);

		} else {
			TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_SET_ACTIVE_TAB,  tab));
		}
	}

	protected void handleSetActiveTab(TabProxy tab)
	{
		tab.setActive(true);
		TiUIAbstractTabGroup tabGroup = (TiUIAbstractTabGroup) view;
		if (tabGroup != null) {
			tabGroup.selectTab(tab);
		}
	}

	@Override
	public void handleCreationDict(KrollDict options) {
		super.handleCreationDict(options);

		// Support setting orientation modes at creation.
		Object orientationModes = options.get(TiC.PROPERTY_ORIENTATION_MODES);
		if (orientationModes != null && orientationModes instanceof Object[]) {
			try {
				int[] modes = TiConvert.toIntArray((Object[]) orientationModes);
				setOrientationModes(modes);

			} catch (ClassCastException e) {
				Log.e(LCAT, "Invalid orientationMode array. Must only contain orientation mode constants.");
			}
		}

		if (options.containsKey(TiC.PROPERTY_ACTIVE_TAB)) {
			setActiveTab(options.get(TiC.PROPERTY_ACTIVE_TAB));
		}
	}

	@Kroll.getProperty @Kroll.method
	public TabProxy getActiveTab() {
		if (TiApplication.isUIThread()) {
			return handleGetActiveTab();

		} else {
			return (TabProxy) TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_GET_ACTIVE_TAB,  tab));
		}
	}

	private TabProxy handleGetActiveTab() {
		TiUIAbstractTabGroup tabGroup = (TiUIAbstractTabGroup) view;
		if (tabGroup != null) {
			return tabGroup.getSelectedTab();

		} else {
			for (TabProxy tab : tabs) {
				if (tab.isActive()) {
					return tab;
				}
			}
		}

		return null;
	}

	@Override
	protected void handleOpen(KrollDict options)
	{
		Activity topActivity = TiApplication.getAppCurrentActivity();
		Intent intent = new Intent(topActivity, TiActivity.class);

		int windowId = TiActivityWindows.addWindow(this);
		intent.putExtra(TiC.INTENT_PROPERTY_USE_ACTIVITY_WINDOW, true);
		intent.putExtra(TiC.INTENT_PROPERTY_WINDOW_ID, windowId);

		topActivity.startActivity(intent);
	}

	@Override
	public void windowCreated(TiBaseActivity activity) {
		activity.setWindowProxy(this);

		// Use the navigation tabs if this platform supports the action bar.
		// Otherwise we will fall back to using the TabHost implementation.
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.HONEYCOMB) {
			view = new TiUIActionBarTabGroup(this, activity);

		} else {
			view = new TiUITabHostGroup(this, activity);
		}

		setModelListener(view);

		handlePostOpen();
	}

	@Override
	public void handlePostOpen()
	{
		super.handlePostOpen();

		TiUIAbstractTabGroup tg = (TiUIAbstractTabGroup) view;
		for(TabProxy tab : tabs) {
			tg.addTab(tab);
		}

		// TODO(josh): verify we don't create a regression
		// Make sure the tab indicator is selected. We need to force it to be selected due to TIMOB-7832.
		// tg.setTabIndicatorSelected(initialActiveTab);

		// Setup the new tab activity like setting orientation modes.
		onWindowActivityCreated();

		opened = true;
		fireEvent(TiC.EVENT_OPEN, null);
	}

	@Override
	protected void handleClose(KrollDict options)
	{
		if (DBG) {
			Log.d(LCAT, "handleClose: " + options);
		}
		
		modelListener = null;
		releaseViews();
		view = null;

		opened = false;
	}


	public KrollDict buildFocusEvent(int toIndex, int fromIndex)
	{
		KrollDict e = new KrollDict();

		e.put(TiC.EVENT_PROPERTY_INDEX, toIndex);
		e.put(TiC.EVENT_PROPERTY_PREVIOUS_INDEX, fromIndex);

		if (fromIndex != -1) {
			e.put(TiC.EVENT_PROPERTY_PREVIOUS_TAB, tabs.get(fromIndex));
		} else {
			KrollDict fakeTab = new KrollDict();
			fakeTab.put(TiC.PROPERTY_TITLE, "no tab");
			e.put(TiC.EVENT_PROPERTY_PREVIOUS_TAB, fakeTab);
		}

		if (toIndex != -1) {
			e.put(TiC.EVENT_PROPERTY_TAB, tabs.get(toIndex));
		}

		return e;
	}

	// TODO(josh): remove this code and save what we need.
	private void fillIntent(Activity activity, Intent intent)
	{
		if (hasProperty(TiC.PROPERTY_FULLSCREEN)) {
			intent.putExtra(TiC.PROPERTY_FULLSCREEN, TiConvert.toBoolean(getProperty(TiC.PROPERTY_FULLSCREEN)));
		}
		if (hasProperty(TiC.PROPERTY_NAV_BAR_HIDDEN)) {
			intent.putExtra(TiC.PROPERTY_NAV_BAR_HIDDEN, TiConvert.toBoolean(getProperty(TiC.PROPERTY_NAV_BAR_HIDDEN)));
		}
		if (hasProperty(TiC.PROPERTY_WINDOW_SOFT_INPUT_MODE)) {
			intent.putExtra(TiC.PROPERTY_WINDOW_SOFT_INPUT_MODE, TiConvert.toInt(getProperty(TiC.PROPERTY_WINDOW_SOFT_INPUT_MODE)));
		}

		if (hasProperty(TiC.PROPERTY_EXIT_ON_CLOSE)) {
			intent.putExtra(TiC.INTENT_PROPERTY_FINISH_ROOT, TiConvert.toBoolean(getProperty(TiC.PROPERTY_EXIT_ON_CLOSE)));
		} else {
			intent.putExtra(TiC.INTENT_PROPERTY_FINISH_ROOT, activity.isTaskRoot());
		}
	}

	@Override
	public KrollDict handleToImage()
	{
		// TODO we need to expose properties again as a KrollDict?
		return TiUIHelper.viewToImage(new KrollDict(), getActivity().getWindow().getDecorView());
	}

	@Override
	public void releaseViews()
	{
		super.releaseViews();
		if (tabs != null) {
			synchronized (tabs) {
				for (TabProxy t : tabs) {
					t.setTabGroup(null);
					t.releaseViews();
				}
			}
		}
		// Don't clear the tabs collection -- it contains proxies, not views
		//tabs.clear();
	}

	@Override
	protected Activity getWindowActivity()
	{
		// TODO(josh): do we need to return the tab group activity here?
		return null;
	}

	@Kroll.method @Kroll.setProperty
	@Override
	public void setOrientationModes(int[] modes) {
		// Unlike Windows this setter is not defined in JavaScript.
		// We need to expose it here with an annotation.
		super.setOrientationModes(modes);
	}
}
