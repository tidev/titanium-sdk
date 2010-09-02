/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.proxy.TiWindowProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;

public class TabProxy extends TiViewProxy
{
	private static final String LCAT = "TabProxy";
	private static final boolean DBG = TiConfig.LOGD;

	private TiWindowProxy win;
	private TabGroupProxy tabGroupProxy;

	public TabProxy(TiContext tiContext, Object[] args) {
		super(tiContext, args);
	}
	
	@Override
	protected TiDict getLangConverstionTable() {
		TiDict table = new TiDict();
		table.put("title","titleid");
		return table;
	}
	

	@Override
	public TiUIView createView(Activity activity) {
		return null;
	}

	public void open(TiWindowProxy win, TiDict options) {
		if (win != null) {
			if (options == null) {
				options = new TiDict();
			}

			this.win = win;
			this.win.setTabProxy(this);
			this.win.setTabGroupProxy(tabGroupProxy);
			options.put("tabOpen", true);
			win.open(options);
		}
	}

	public void close(TiDict options) {
		if (win != null) {
			win.close(options);
			win = null;
		}
	}

	public void setTabGroup(TabGroupProxy tabGroupProxy) {
		this.tabGroupProxy = tabGroupProxy;
	}
}
