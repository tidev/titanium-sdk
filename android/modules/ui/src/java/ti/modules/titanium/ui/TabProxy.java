/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.proxy.TiWindowProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.tabgroup.TiUIAbstractTab;
import android.app.Activity;

@Kroll.proxy(creatableInModule=UIModule.class,
propertyAccessors = {
	TiC.PROPERTY_TITLE,
	TiC.PROPERTY_TITLEID,
	TiC.PROPERTY_ICON
})
public class TabProxy extends TiViewProxy
{
	@SuppressWarnings("unused")
	private static final String TAG = "TabProxy";

	private TiWindowProxy win;
	private TabGroupProxy tabGroupProxy;
	private int windowId;

	public TabProxy()
	{
		super();
	}

	public TabProxy(TiContext tiContext)
	{
		this();
	}

	@Override
	protected KrollDict getLangConversionTable()
	{
		KrollDict table = new KrollDict();
		table.put(TiC.PROPERTY_TITLE, TiC.PROPERTY_TITLEID);
		return table;
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		return null;
	}

	@Override
	public void handleCreationDict(KrollDict options)
	{
		super.handleCreationDict(options);
		Object window = options.get(TiC.PROPERTY_WINDOW);
		if (window instanceof TiWindowProxy) {
			setWindow((TiWindowProxy) window);
		}
	}

	@Kroll.getProperty @Kroll.method
	public boolean getActive() {
		if (tabGroupProxy != null) {
			return tabGroupProxy.getActiveTab() == this;
		}

		return false;
	}

	@Kroll.setProperty @Kroll.method
	public void setActive(boolean active) {
		if (tabGroupProxy != null) {
			tabGroupProxy.setActiveTab(this);
		}
	}

	@Kroll.method
	public void setWindow(TiWindowProxy window)
	{
		this.win = window;

		// don't call setProperty cause the property is already set on the JS
		// object and thus we don't need to cross back over the bridge, we just
		// need to set it on the internal properties map of the proxy
		properties.put(TiC.PROPERTY_WINDOW, window);

		if (window == null) {
			return;
		}

		this.win.setTabProxy(this);

		if (tabGroupProxy != null) {
			// Set window's tab group if this tab has been added to a group.
			this.win.setTabGroupProxy(tabGroupProxy);
		}

		//Send out a sync event to indicate window is added to tab
		this.win.fireSyncEvent(TiC.EVENT_ADDED_TO_TAB, null);
		// TODO: Deprecate old event
		this.win.fireSyncEvent("addedToTab", null);
	}

	public TiWindowProxy getWindow()
	{
		return this.win;
	}

	@Kroll.method @Kroll.getProperty
	public TabGroupProxy getTabGroup()
	{
		return this.tabGroupProxy;
	}

	public void setTabGroup(TabGroupProxy tabGroupProxy) 
	{
		setParent(tabGroupProxy);
		this.tabGroupProxy = tabGroupProxy;

		if (win != null) {
			// If a window was set before the tab
			// was added to a group we need to initialize
			// the window's tab group reference.
			win.setTabGroupProxy(tabGroupProxy);
		}
	}

	public void setWindowId(int id)
	{
		windowId = id;
	}
	
	public int getWindowId() 
	{
		return windowId;
	}
	
	@Override
	public void releaseViews()
	{
		super.releaseViews();
		if (win != null) {
			win.setTabProxy(null);
			win.setTabGroupProxy(null);
			win.releaseViews();
		}
	}

	/**
	 * Get the color of the tab when it is active.
	 *
	 * @return the active color if specified, otherwise returns zero.
	 */
	public int getActiveTabColor()
	{
		Object color = getProperty(TiC.PROPERTY_BACKGROUND_SELECTED_COLOR);
		if (color == null) {
			color = tabGroupProxy.getProperty(TiC.PROPERTY_ACTIVE_TAB_BACKGROUND_COLOR);
		}

		if (color != null) {
			return TiConvert.toColor(color.toString());
		}

		return 0;
	}

	/**
	 * Get the color of the tab when it is inactive.
	 *
	 * @return the inactive color if specified, otherwise returns zero.
	 */
	public int getTabColor()
	{
		Object color = getProperty(TiC.PROPERTY_BACKGROUND_COLOR);
		if (color == null) {
			color = tabGroupProxy.getProperty(TiC.PROPERTY_TABS_BACKGROUND_COLOR);
		}

		if (color != null) {
			return TiConvert.toColor(color.toString());
		}

		return 0;
	}

	void onFocusChanged(boolean focused, KrollDict eventData)
	{
		// The focus and blur events for tab changes propagate like so:
		//    window -> tab -> tab group
		//
		// The window is optional and will be skipped if it does not exist.
		TiViewProxy eventEmitter = (win != null) ? win : this;
		eventEmitter.fireEvent((focused) ? TiC.EVENT_FOCUS : TiC.EVENT_BLUR, eventData, true);
	}

	void onSelectionChanged(boolean selected)
	{
		((TiUIAbstractTab) view).onSelectionChange(selected);
	}

}
