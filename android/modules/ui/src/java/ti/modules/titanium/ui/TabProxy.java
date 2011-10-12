/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
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
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;

@Kroll.proxy(creatableInModule=UIModule.class,
propertyAccessors = {
	TiC.PROPERTY_TITLE,
	TiC.PROPERTY_WINDOW,
	TiC.PROPERTY_ICON
})
public class TabProxy extends TiViewProxy
{
	private TiWindowProxy win;
	private TabGroupProxy tabGroupProxy;

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

	@Kroll.method
	public void open(TiWindowProxy win, @Kroll.argument(optional=true) KrollDict options)
	{
		if (win != null) {
			if (options == null) {
				options = new KrollDict();
			}

			this.win = win;
			this.win.setTabProxy(this);
			this.win.setTabGroupProxy(tabGroupProxy);
			options.put(TiC.PROPERTY_TAB_OPEN, true);
			win.open(options);
		}
	}

	@Kroll.method
	public void close(@Kroll.argument(optional=true) KrollDict options)
	{
		if (win != null) {
			win.close(options);
			win = null;
		}
	}

	public void setTabGroup(TabGroupProxy tabGroupProxy) 
	{
		this.tabGroupProxy = tabGroupProxy;
	}

	@Override
	public void releaseViews()
	{
		super.releaseViews();
		if (win != null) {
			win.setTabGroupProxy(null);
			win.releaseViews();
		}
	}
}
