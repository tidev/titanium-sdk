/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.proxy.TiWindowProxy;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.TiUITabGroup;
import android.app.Activity;
import android.os.Message;

@Kroll.proxy(creatableInModule=UIModule.class,
propertyAccessors = {
	TiC.PROPERTY_TITLE,
	TiC.PROPERTY_TITLEID,
	TiC.PROPERTY_ICON
})
public class TabProxy extends TiViewProxy
{
	private static final String TAG = "TabProxy";

	private TiWindowProxy win;
	private TabGroupProxy tabGroupProxy;
	private int windowId;
	private String currentBackgroundColor = "";
	private static final int MSG_FIRST_ID = TiViewProxy.MSG_LAST_ID + 1;
	private final int MSG_TAB_BACKGROUND_COLOR_CHANGED = MSG_FIRST_ID + 101;
	private final int MSG_TAB_BACKGROUND_SELECTED_COLOR_CHANGED = MSG_FIRST_ID + 102;


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

	public void setCurrentBackgroundColor(String color)
	{
		currentBackgroundColor = color;
	}

	public String getCurrentBackgroundColor()
	{
		return currentBackgroundColor;
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
		this.win.setTabGroupProxy(tabGroupProxy);
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
	}

	public void setWindowId(int id)
	{
		windowId = id;
	}
	
	public String getBackgroundColor() {
		if (hasProperty(TiC.PROPERTY_BACKGROUND_COLOR)) {
			return getProperty(TiC.PROPERTY_BACKGROUND_COLOR).toString();
		} else {
			return null;
		}
	}
	
	public String getBackgroundSelectedColor() {
		if (hasProperty(TiC.PROPERTY_BACKGROUND_SELECTED_COLOR)) {
			return getProperty(TiC.PROPERTY_BACKGROUND_SELECTED_COLOR).toString();
		} else {
			return null;
		}
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
	
	public void setTabBackgroundColor() 
	{
		int index = tabGroupProxy.getTabList().indexOf(this);
		TiUITabGroup tg = (TiUITabGroup)tabGroupProxy.peekView();
		if (tg != null) {
			tg.setTabBackgroundColor(index);
		}
	}
	
	public void setTabBackgroundSelectedColor()
	{
		TiUITabGroup tg = (TiUITabGroup)tabGroupProxy.peekView();
		if (tg != null) {
			tg.setTabBackgroundSelectedColor();
		}
	}
	
	@Override
	public void onPropertyChanged(String name, Object value) 
	{
		super.onPropertyChanged(name, value);
		if (name.equals(TiC.PROPERTY_BACKGROUND_COLOR)) {
			
			//This needs to run on main thread.
			if (TiApplication.isUIThread()) {
				setTabBackgroundColor();
				return;
			}
			
			getMainHandler().obtainMessage(MSG_TAB_BACKGROUND_COLOR_CHANGED).sendToTarget();
			
		} else if (name.equals(TiC.PROPERTY_BACKGROUND_SELECTED_COLOR)) {
			
			//This needs to run on main thread.
			if (TiApplication.isUIThread()) {
				setTabBackgroundSelectedColor();
				return;
			}
			
			getMainHandler().obtainMessage(MSG_TAB_BACKGROUND_SELECTED_COLOR_CHANGED).sendToTarget();

		}
	}
	
	@Override
	public boolean handleMessage(Message msg)
	{
		switch (msg.what) {
			case MSG_TAB_BACKGROUND_SELECTED_COLOR_CHANGED: {
				setTabBackgroundSelectedColor();
				return true;
			}
			case MSG_TAB_BACKGROUND_COLOR_CHANGED: {
				setTabBackgroundColor();
				return true;
			}
			default: {
				return super.handleMessage(msg);
			}
		}
	}
}
